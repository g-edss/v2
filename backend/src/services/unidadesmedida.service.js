import { query } from '../config/db.js';

export async function listarActivas() {
  const { rows } = await query(
    `SELECT
       id,
       nombre,
       simbolo,
       tipo_dato,
       descripcion
     FROM unidades_medida
     WHERE activo = TRUE
     ORDER BY nombre ASC`
  );

  return rows;
}