// Service de Procesos: aquí vive la lógica de negocio y el acceso a datos.
import { query } from '../config/db.js';

export async function listar() {
  const { rows } = await query(
    `SELECT p.id, p.nombre, p.correo, p.estatus, p.creado_en,
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

export async function crear({ nombre, responsable_id, correo, descripcion, creado_por }) {
  // Diagrama 1: el registro es inmediato, sin revisión ni aprobación.
  const { rows } = await query(
    `INSERT INTO procesos (nombre, responsable_id, correo, descripcion, estatus, creado_por)
     VALUES ($1, $2, $3, $4, 'activo', $5)
     RETURNING *`,
    [nombre, responsable_id, correo, descripcion, creado_por]
  );
  // TODO: encolar notificación por correo al responsable asignado.
  return rows[0];
}
