import { pool } from '../config/db.js';

export async function listarNotificaciones(usuarioId) {
    const { rows } = await pool.query(
        `SELECT id, mensaje, enlace, leida, creado_en
        FROM notificaciones
        WHERE usuario_id = $1
        ORDER BY creado_en DESC, id DESC
        LIMIT 50`,
        [usuarioId],
    );

    return rows;
}

export async function contarNoLeidas(usuarioId) {
    const { rows } = await pool.query(
        `SELECT COUNT(*)::int AS total
        FROM notificaciones
        WHERE usuario_id = $1
        AND leida = false`,
        [usuarioId],
    );

    return rows[0].total;
}

export async function marcarComoLeida(notificacionId, usuarioId) {
    const { rows } = await pool.query(
        `UPDATE notificaciones
        SET leida = true
        WHERE id = $1
        AND usuario_id = $2
        RETURNING id, mensaje, enlace, leida, creado_en`,
        [notificacionId, usuarioId],
    );

    return rows[0] || null;
}