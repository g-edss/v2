import * as solicitudesService from
    '../services/solicitudes.service.js';

export async function listar(req, res, next) {
    try {
        const solicitudes =
            await solicitudesService.listarSolicitudes({
                usuarioId: Number(req.auth.sub),
                rol: req.auth.rol,
            });

        res.json(solicitudes);
    } catch (error) {
        next(error);
    }
}

export async function avanzar(req, res, next) {
    try {
        const solicitudId = Number(req.params.id);
        const comentario =
            String(req.body.comentario || '').trim();

        if (
            !Number.isInteger(solicitudId) ||
            solicitudId <= 0
        ) {
            return res.status(400).json({
                error: 'La solicitud no es válida.',
            });
        }

        if (comentario.length > 2000) {
            return res.status(400).json({
                error:
                    'El comentario debe tener máximo 2000 caracteres.',
            });
        }

        const solicitud =
            await solicitudesService.avanzarSolicitud({
                solicitudId,
                usuarioId: Number(req.auth.sub),
                comentario,
            });

        res.json({
            mensaje:
                'La solicitud avanzó a la siguiente etapa.',
            solicitud,
        });
    } catch (error) {
        next(error);
    }
}

export async function aprobar(req, res, next) {
    try {
        const solicitudId = Number(req.params.id);
        const comentario =
            String(req.body.comentario || '').trim();

        const codigo =
            String(req.body.codigo || '').trim().toUpperCase();

        if (!codigo) {
            return res.status(400).json({
                error: 'Debes asignar el código institucional.',
            });
        }

        if (codigo.length > 60) {
            return res.status(400).json({
                error:
                    'El código debe tener máximo 60 caracteres.',
            });
        }

        if (
            !Number.isInteger(solicitudId) ||
            solicitudId <= 0
        ) {
            return res.status(400).json({
                error: 'La solicitud no es válida.',
            });
        }

        if (comentario.length > 2000) {
            return res.status(400).json({
                error:
                    'El comentario debe tener máximo 2000 caracteres.',
            });
        }

        const solicitud =
            await solicitudesService.aprobarSolicitud({
                solicitudId,
                usuarioId: Number(req.auth.sub),
                comentario,
                codigo,
            });

        res.json({
            mensaje: 'El documento fue aprobado y publicado.',
            solicitud,
        });
    } catch (error) {
        next(error);
    }
}

export async function devolver(req, res, next) {
    try {
        const solicitudId = Number(req.params.id);
        const comentario =
            String(req.body.comentario || '').trim();

        if (
            !Number.isInteger(solicitudId) ||
            solicitudId <= 0
        ) {
            return res.status(400).json({
                error: 'La solicitud no es válida.',
            });
        }

        if (!comentario) {
            return res.status(400).json({
                error:
                    'Debes explicar qué correcciones se requieren.',
            });
        }

        if (comentario.length > 2000) {
            return res.status(400).json({
                error:
                    'El comentario debe tener máximo 2000 caracteres.',
            });
        }

        const solicitud =
            await solicitudesService.solicitarCorrecciones({
                solicitudId,
                usuarioId: Number(req.auth.sub),
                comentario,
            });

        res.json({
            mensaje:
                'El documento fue devuelto para correcciones.',
            solicitud,
        });
    } catch (error) {
        next(error);
    }
}

export async function rechazar(req, res, next) {
    try {
        const solicitudId = Number(req.params.id);
        const comentario =
            String(req.body.comentario || '').trim();

        if (
            !Number.isInteger(solicitudId) ||
            solicitudId <= 0
        ) {
            return res.status(400).json({
                error: 'La solicitud no es válida.',
            });
        }

        if (!comentario) {
            return res.status(400).json({
                error:
                    'Debes explicar el motivo del rechazo.',
            });
        }

        if (comentario.length > 2000) {
            return res.status(400).json({
                error:
                    'El comentario debe tener máximo 2000 caracteres.',
            });
        }

        const solicitud =
            await solicitudesService.rechazarSolicitud({
                solicitudId,
                usuarioId: Number(req.auth.sub),
                comentario,
            });

        res.json({
            mensaje:
                'La solicitud y el documento fueron rechazados.',
            solicitud,
        });
    } catch (error) {
        next(error);
    }
}