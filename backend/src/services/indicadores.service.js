import { query } from '../config/db.js';

export async function listar() {
  const { rows } = await query(
    `SELECT
       i.id,
       i.codigo,
       i.nombre,
       i.descripcion,
       i.proceso_id,
       p.nombre AS proceso,
       p.responsable_id,
       u.nombre AS responsable,
       u.puesto AS responsable_puesto,
       u.correo AS responsable_correo,
       i.unidad_medida_id,
       um.nombre AS unidad_medida,
       um.simbolo AS unidad_simbolo,
       um.tipo_dato,
       i.frecuencia,
       i.meta_minima,
       i.meta_maxima,
       i.sentido,
       i.activo,
       i.creado_en,
       i.actualizado_en
     FROM indicadores i
     JOIN procesos p
       ON p.id = i.proceso_id
     JOIN usuarios u
       ON u.id = p.responsable_id
     JOIN unidades_medida um
       ON um.id = i.unidad_medida_id
     ORDER BY i.creado_en DESC`
  );

  return rows;
}

export async function crear({
  codigo,
  nombre,
  descripcion,
  proceso_id,
  unidad_medida_id,
  frecuencia,
  meta_minima,
  meta_maxima,
  sentido,
  creado_por,
}) {
  const { rows } = await query(
    `INSERT INTO indicadores (
       codigo,
       nombre,
       descripcion,
       proceso_id,
       unidad_medida_id,
       frecuencia,
       meta_minima,
       meta_maxima,
       sentido,
       creado_por
     )
     SELECT
       $1,
       $2,
       $3,
       p.id,
       um.id,
       $6,
       $7,
       $8,
       $9,
       $10
     FROM procesos p
     CROSS JOIN unidades_medida um
     WHERE p.id = $4
       AND p.estatus = 'activo'
       AND um.id = $5
       AND um.activo = TRUE
     RETURNING *`,
    [
      codigo,
      nombre,
      descripcion,
      proceso_id,
      unidad_medida_id,
      frecuencia,
      meta_minima,
      meta_maxima,
      sentido,
      creado_por,
    ]
  );

  const indicador = rows[0];

  if (!indicador) {
    const error = new Error('Proceso o unidad de medida no válidos');
    error.status = 400;
    error.publico =
      'El proceso o la unidad de medida no existen o están inactivos';
    throw error;
  }

  return indicador;
}

export async function actualizar(
  id,
  {
    codigo,
    nombre,
    descripcion,
    proceso_id,
    unidad_medida_id,
    frecuencia,
    meta_minima,
    meta_maxima,
    sentido,
    activo,
  }
) {
  const { rows } = await query(
    `UPDATE indicadores i
        SET codigo = $1,
            nombre = $2,
            descripcion = $3,
            proceso_id = p.id,
            unidad_medida_id = um.id,
            frecuencia = $6,
            meta_minima = $7,
            meta_maxima = $8,
            sentido = $9,
            activo = $10,
            actualizado_en = now()
       FROM procesos p
       CROSS JOIN unidades_medida um
      WHERE i.id = $11
        AND p.id = $4
        AND p.estatus = 'activo'
        AND um.id = $5
        AND um.activo = TRUE
      RETURNING i.*`,
    [
      codigo,
      nombre,
      descripcion,
      proceso_id,
      unidad_medida_id,
      frecuencia,
      meta_minima,
      meta_maxima,
      sentido,
      activo,
      id,
    ]
  );

  const indicador = rows[0];

  if (!indicador) {
    const error = new Error(
      'Indicador, proceso o unidad de medida no válidos'
    );

    error.status = 400;
    error.publico =
      'El indicador no existe o seleccionaste un proceso o unidad inactivos';

    throw error;
  }

  return indicador;
}

export async function desactivar(id) {
  const { rows } = await query(
    `UPDATE indicadores
        SET activo = FALSE,
            actualizado_en = now()
      WHERE id = $1
      RETURNING *`,
    [id]
  );

  const indicador = rows[0];

  if (!indicador) {
    const error = new Error('Indicador no encontrado');
    error.status = 404;
    error.publico = 'El indicador no existe';
    throw error;
  }

  return indicador;
}