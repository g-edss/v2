import bcrypt from 'bcrypt';
import { query } from '../config/db.js';
const ROLES_DE_USUARIO = new Set([
  'admin_general',
  'responsable',
  'revisor',
  'aprobador',
  'visor',
]);

function validarRolDeUsuario(rol_clave) {
  if (!ROLES_DE_USUARIO.has(rol_clave)) {
    const error = new Error('Rol no permitido');
    error.status = 400;
    error.publico = 'El rol indicado no está disponible para usuarios.';
    throw error;
  }
}

export async function crear({
  nombre,
  correo,
  puesto,
  rol_clave,
  password,
}) {
  const correoNormalizado = correo.trim().toLowerCase();

  validarRolDeUsuario(rol_clave);

  const { rows: roles } = await query(
    'SELECT id, nombre FROM roles WHERE clave = $1',
    [rol_clave]
  );

  const rol = roles[0];

  if (!rol) {
    const error = new Error('Rol no válido');
    error.status = 400;
    error.publico = 'El rol indicado no existe';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const { rows } = await query(
      `INSERT INTO usuarios (nombre, correo, puesto, rol_id, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, nombre, correo, puesto, activo, creado_en`,
      [
        nombre.trim(),
        correoNormalizado,
        puesto?.trim() || null,
        rol.id,
        passwordHash,
      ]
    );

    return {
      ...rows[0],
      rol: rol.nombre,
      rol_clave,
    };
  } catch (error) {
    if (error.code === '23505') {
      error.status = 409;
      error.publico = 'Ya existe un usuario con ese correo';
    }

    throw error;
  }
}

export async function listar() {
  const { rows } = await query(
    `SELECT u.id, u.nombre, u.correo, u.puesto, u.activo, u.creado_en,
            r.clave AS rol_clave, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      ORDER BY u.creado_en DESC`
  );
  return rows;
}

export async function actualizar(id, { nombre, correo, puesto, rol_clave, password, activo }) {
  const campos = [];
  const valores = [];
  let i = 1;

  if (nombre !== undefined)  { campos.push(`nombre = $${i++}`);  valores.push(nombre.trim()); }
  if (correo !== undefined)  { campos.push(`correo = $${i++}`);  valores.push(correo.trim().toLowerCase()); }
  if (puesto !== undefined)  { campos.push(`puesto = $${i++}`);  valores.push(puesto?.trim() || null); }
  if (activo !== undefined)  { campos.push(`activo = $${i++}`);  valores.push(activo); }

  if (rol_clave !== undefined) {
    validarRolDeUsuario(rol_clave);
    
    const { rows: roles } = await query('SELECT id FROM roles WHERE clave = $1', [rol_clave]);
    const rol = roles[0];

    if (!rol) {
      const error = new Error('Rol no válido');
      error.status = 400;
      error.publico = 'El rol indicado no existe';
      throw error;
    }

    campos.push(`rol_id = $${i++}`);
    valores.push(rol.id);
  }

  if (password) {
    const passwordHash = await bcrypt.hash(password, 12);
    campos.push(`password_hash = $${i++}`);
    valores.push(passwordHash);
  }

  if (campos.length === 0) {
    const error = new Error('Nada que actualizar');
    error.status = 400;
    error.publico = 'No se enviaron cambios';
    throw error;
  }

  valores.push(id);

  try {
    const { rows } = await query(
      `UPDATE usuarios SET ${campos.join(', ')}
        WHERE id = $${i}
       RETURNING id, nombre, correo, puesto, activo, creado_en, rol_id`,
      valores
    );

    const usuario = rows[0];

    if (!usuario) {
      const error = new Error('Usuario no encontrado');
      error.status = 404;
      error.publico = 'Usuario no encontrado';
      throw error;
    }

    const { rows: rolRows } = await query('SELECT clave, nombre FROM roles WHERE id = $1', [usuario.rol_id]);

    return { ...usuario, rol_clave: rolRows[0]?.clave, rol: rolRows[0]?.nombre };
  } catch (error) {
    if (error.code === '23505') {
      error.status = 409;
      error.publico = 'Ya existe un usuario con ese correo';
    }
    throw error;
  }
}

export async function eliminar(id) {
  const { rows } = await query(
    `UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id`,
    [id]
  );

  if (!rows[0]) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    error.publico = 'Usuario no encontrado';
    throw error;
  }

  return rows[0];
}