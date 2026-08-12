import bcrypt from 'bcrypt';
import { query } from '../config/db.js';

export async function crear({
  nombre,
  correo,
  puesto,
  rol_clave,
  password,
}) {
  const correoNormalizado = correo.trim().toLowerCase();

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