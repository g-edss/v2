import * as notificacionesService from '../services/notificaciones.service.js';

export async function listar(req, res, next) {
    try {
        const usuarioId = Number(req.auth.sub);

        const [notificaciones, noLeidas] = await Promise.all([
            notificacionesService.listarNotificaciones(usuarioId),
            notificacionesService.contarNoLeidas(usuarioId),
        ]);

        res.json({
            notificaciones,
            no_leidas: noLeidas,
        });
    } catch (error) {
        next(error);
    }
}

export async function marcarLeida(req, res, next) {
    try {
        const notificacionId = Number(req.params.id);
        const usuarioId = Number(req.auth.sub);

        if (!Number.isInteger(notificacionId) || notificacionId <= 0) {
            return res.status(400).json({
                error: 'La notificación no es válida.',
            });
        }

        const notificacion =
            await notificacionesService.marcarComoLeida(
                notificacionId,
                usuarioId,
            );

        if (!notificacion) {
            return res.status(404).json({
                error: 'No se encontró la notificación.',
            });
        }

        res.json(notificacion);
    } catch (error) {
        next(error);
    }
}