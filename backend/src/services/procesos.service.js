// Service de Procesos: aquí vive la lógica de negocio y el acceso a datos.
import { query } from '../config/db.js';

export async function listar() {
  const { rows } = await query(
  `SELECT
     p.id,
     p.nombre,
     p.responsable_id,
     p.correo,
     p.descripcion,
     p.estatus,
     p.creado_en,
     u.nombre AS responsable
   FROM procesos p
   JOIN usuarios u ON u.id = p.responsable_id
   ORDER BY p.creado_en DESC`
);
  return rows;
}

export async function obtenerPorId(id) {
  const { rows } = await query('SELECT * FROM procesos WHERE id = $1', [id]);
  return rows[0] || null;
}

export async function crear({
  nombre,
  responsable_id,
  descripcion,
  creado_por,
}) {
  const { rows } = await query(
    `INSERT INTO procesos (
       nombre,
       responsable_id,
       correo,
       descripcion,
       estatus,
       creado_por
     )
     SELECT
       $1,
       u.id,
       u.correo,
       $2,
       'activo',
       $3
     FROM usuarios u
     WHERE u.id = $4
       AND u.activo = TRUE
     RETURNING *`,
    [nombre, descripcion, creado_por, responsable_id]
  );

  const proceso = rows[0];

  if (!proceso) {
    const error = new Error('Responsable no válido');
    error.status = 400;
    error.publico = 'El responsable no existe o está inactivo';
    throw error;
  }

  return proceso;
}

export async function actualizar(
  id,
  { nombre, responsable_id, descripcion, estatus }
) {
  const { rows } = await query(
    `UPDATE procesos p
        SET nombre = $1,
            responsable_id = u.id,
            correo = u.correo,
            descripcion = $2,
            estatus = $3
       FROM usuarios u
      WHERE p.id = $4
        AND u.id = $5
        AND u.activo = TRUE
      RETURNING p.*`,
    [nombre, descripcion, estatus, id, responsable_id]
  );

  const proceso = rows[0];

  if (!proceso) {
    const error = new Error('Proceso o responsable no válido');
    error.status = 404;
    error.publico = 'El proceso no existe o el responsable está inactivo';
    throw error;
  }

  return proceso;
}

export async function desactivar(id) {
  const { rows } = await query(
    `UPDATE procesos
        SET estatus = 'inactivo'
      WHERE id = $1
      RETURNING *`,
    [id]
  );

  const proceso = rows[0];

  if (!proceso) {
    const error = new Error('Proceso no encontrado');
    error.status = 404;
    error.publico = 'Proceso no encontrado';
    throw error;
  }

  return proceso;
}