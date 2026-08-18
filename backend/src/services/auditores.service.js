import { query } from '../config/db.js';

export async function listar() {
  const { rows } = await query(
    `SELECT
       a.id,
       a.codigo,
       a.usuario_id,
       a.activo,
       a.creado_en,
       u.nombre,
       u.correo,
       u.puesto
     FROM auditores a
     JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.activo = TRUE
     ORDER BY a.codigo ASC`
  );

  return rows;
}

export async function crear({ codigo, usuario_id }) {
  const codigoNormalizado = codigo.trim().toUpperCase();

  try {
    // Si el usuario fue auditor antes y está inactivo, lo reactivamos.
    const { rows: reactivados } = await query(
      `UPDATE auditores
       SET codigo = $1,
           activo = TRUE
       WHERE usuario_id = $2
         AND activo = FALSE
       RETURNING id, codigo, usuario_id, activo, creado_en`,
      [codigoNormalizado, usuario_id]
    );

    if (reactivados[0]) {
      return reactivados[0];
    }

    // Si nunca fue auditor, se crea su registro.
    const { rows } = await query(
      `INSERT INTO auditores (codigo, usuario_id)
       SELECT $1, u.id
       FROM usuarios u
       WHERE u.id = $2
         AND u.activo = TRUE
       RETURNING id, codigo, usuario_id, activo, creado_en`,
      [codigoNormalizado, usuario_id]
    );

    const auditor = rows[0];

    if (!auditor) {
      const error = new Error('Usuario no disponible');
      error.status = 400;
      error.publico = 'Selecciona un usuario activo.';
      throw error;
    }

    return auditor;
  } catch (error) {
    if (error.code === '23505') {
      error.status = 409;
      error.publico =
        'Ese código ya existe o el usuario ya está activo como auditor.';
    }

    throw error;
  }
}

export async function actualizar(id, { codigo }) {
  try {
    const { rows } = await query(
      `UPDATE auditores
       SET codigo = $1
       WHERE id = $2
       RETURNING id, codigo, usuario_id, activo, creado_en`,
      [codigo.trim().toUpperCase(), id]
    );

    const auditor = rows[0];

    if (!auditor) {
      const error = new Error('Auditor no encontrado');
      error.status = 404;
      error.publico = 'Auditor no encontrado.';
      throw error;
    }

    return auditor;
  } catch (error) {
    if (error.code === '23505') {
      error.status = 409;
      error.publico = 'Ese código ya está registrado como auditor.';
    }

    throw error;
  }
}

export async function desactivar(id) {
  const { rows } = await query(
    `UPDATE auditores
     SET activo = FALSE
     WHERE id = $1
     RETURNING id, codigo, usuario_id, activo, creado_en`,
    [id]
  );

  const auditor = rows[0];

  if (!auditor) {
    const error = new Error('Auditor no encontrado');
    error.status = 404;
    error.publico = 'Auditor no encontrado.';
    throw error;
  }

  return auditor;
}