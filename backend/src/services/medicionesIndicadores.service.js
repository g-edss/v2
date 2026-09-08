import { query } from '../config/db.js';

export async function listarPorIndicador(
  indicadorId,
  { usuario_id, rol }
) {
  const { rows } = await query(
    `SELECT
       m.id,
       m.indicador_id,
       m.fecha_medicion,
       m.resultado,
       m.observaciones,
       m.capturado_por,
       u.nombre AS capturado_por_nombre,
       m.creado_en,
       m.actualizado_en
     FROM mediciones_indicadores m
     JOIN indicadores i
       ON i.id = m.indicador_id
     JOIN procesos p
       ON p.id = i.proceso_id
     JOIN usuarios u
       ON u.id = m.capturado_por
     WHERE m.indicador_id = $1
       AND (
         $3 = 'admin_general'
         OR p.responsable_id = $2
         OR EXISTS (
           SELECT 1
           FROM indicador_usuarios iu
           WHERE iu.indicador_id = i.id
             AND iu.usuario_id = $2
         )
       )
     ORDER BY m.fecha_medicion ASC`,
    [indicadorId, usuario_id, rol]
  );

  return rows;
}

export async function crear({
  indicador_id,
  fecha_medicion,
  resultado,
  observaciones,
  capturado_por,
  rol,
}) {
  const { rows } = await query(
    `INSERT INTO mediciones_indicadores (
       indicador_id,
       fecha_medicion,
       resultado,
       observaciones,
       capturado_por
     )
     SELECT
       i.id,
       $2,
       $3,
       $4,
       $5
     FROM indicadores i
     JOIN procesos p
       ON p.id = i.proceso_id
     WHERE i.id = $1
       AND i.activo = TRUE
       AND (
         $6 = 'admin_general'
         OR EXISTS (
           SELECT 1
           FROM indicador_usuarios iu
           WHERE iu.indicador_id = i.id
             AND iu.usuario_id = $5
             AND iu.puede_capturar = TRUE
         )
       )
     RETURNING *`,
    [
      indicador_id,
      fecha_medicion,
      resultado,
      observaciones,
      capturado_por,
      rol,
    ]
  );

  const medicion = rows[0];

  if (!medicion) {
    const error = new Error(
      'Indicador inexistente o usuario sin permiso de captura'
    );

    error.status = 403;
    error.publico =
      'No tienes permiso para capturar mediciones de este indicador';

    throw error;
  }

  return medicion;
}

export async function actualizar(
  medicionId,
  {
    indicador_id,
    fecha_medicion,
    resultado,
    observaciones,
    usuario_id,
    rol,
  }
) {
  const { rows } = await query(
    `UPDATE mediciones_indicadores m
        SET fecha_medicion = $3,
            resultado = $4,
            observaciones = $5,
            actualizado_en = now()
       FROM indicadores i
      WHERE m.id = $1
        AND m.indicador_id = $2
        AND i.id = m.indicador_id
        AND i.activo = TRUE
        AND (
          $7 = 'admin_general'
          OR EXISTS (
            SELECT 1
            FROM indicador_usuarios iu
            WHERE iu.indicador_id = i.id
              AND iu.usuario_id = $6
              AND iu.puede_capturar = TRUE
          )
        )
      RETURNING m.*`,
    [
      medicionId,
      indicador_id,
      fecha_medicion,
      resultado,
      observaciones,
      usuario_id,
      rol,
    ]
  );

  const medicion = rows[0];

  if (!medicion) {
    const error = new Error(
      'Medición inexistente o usuario sin permiso'
    );

    error.status = 403;
    error.publico =
      'No tienes permiso para editar esta medición';

    throw error;
  }

  return medicion;
}

export async function eliminar(
  medicionId,
  indicadorId
) {
  const { rows } = await query(
    `DELETE FROM mediciones_indicadores
      WHERE id = $1
        AND indicador_id = $2
      RETURNING *`,
    [medicionId, indicadorId]
  );

  const medicion = rows[0];

  if (!medicion) {
    const error = new Error('Medición no encontrada');

    error.status = 404;
    error.publico =
      'La medición no existe o no pertenece al indicador';

    throw error;
  }

  return medicion;
}