import * as registrosService from '../services/registros.service.js';

function esFechaValida(valor) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
        return false;
    }

    const [anio, mes, dia] = valor
        .split('-')
        .map(Number);

    const fecha = new Date(
        Date.UTC(anio, mes - 1, dia)
    );

    return (
        fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia
    );
}

export async function listar(req, res, next) {
    try {
        const registros = await registrosService.listar({
            usuarioId: Number(req.auth.sub),
            rol: req.auth.rol
        });

        res.json(registros);
    } catch (error) {
        next(error);
    }
}

export async function obtener(req, res, next) {
    try {
        const registroId = Number(req.params.id);

        if (!Number.isInteger(registroId) || registroId <= 0) {
            return res.status(400).json({
                error: 'El registro no es válido.'
            });
        }

        const registro =
            await registrosService.obtenerPorId({
                registroId,
                usuarioId: Number(req.auth.sub),
                rol: req.auth.rol
            });

        if (!registro) {
            return res.status(404).json({
                error: 'Registro no encontrado.'
            });
        }

        res.json(registro);
    } catch (error) {
        next(error);
    }
}

export async function crear(req, res, next) {
    try {
        const nombre =
            typeof req.body.nombre === 'string'
                ? req.body.nombre.trim()
                : '';

        const descripcion =
            typeof req.body.descripcion === 'string'
                ? req.body.descripcion.trim() || null
                : null;

        const procesoId = Number(req.body.proceso_id);
        const responsableId = Number(
            req.body.responsable_id
        );

        const fechaRegistro =
            typeof req.body.fecha_registro === 'string'
                ? req.body.fecha_registro.trim()
                : '';

        if (!nombre || nombre.length > 255) {
            return res.status(400).json({
                error:
                    'El nombre es obligatorio y debe tener máximo 255 caracteres.'
            });
        }

        if (
            !Number.isInteger(procesoId) ||
            procesoId <= 0
        ) {
            return res.status(400).json({
                error: 'Selecciona un proceso válido.'
            });
        }

        if (
            !Number.isInteger(responsableId) ||
            responsableId <= 0
        ) {
            return res.status(400).json({
                error: 'Selecciona un responsable válido.'
            });
        }

        if (!esFechaValida(fechaRegistro)) {
            return res.status(400).json({
                error: 'Selecciona una fecha válida.'
            });
        }

        if (descripcion && descripcion.length > 2000) {
            return res.status(400).json({
                error:
                    'La descripción debe tener máximo 2000 caracteres.'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'Debes seleccionar un archivo.'
            });
        }

        const registro =
            await registrosService.crearConArchivo({
                nombre,
                procesoId,
                responsableId,
                fechaRegistro,
                descripcion,
                creadoPor: Number(req.auth.sub),
                archivo: req.file
            });

        res.status(201).json({
            mensaje: 'Registro guardado correctamente.',
            registro
        });
    } catch (error) {
        next(error);
    }
}

export async function descargarArchivo(req, res, next) {
    try {
        const registroId = Number(req.params.id);

        if (
            !Number.isInteger(registroId) ||
            registroId <= 0
        ) {
            return res.status(400).json({
                error: 'El registro no es válido.'
            });
        }

        const archivo =
            await registrosService.obtenerArchivo({
                registroId,
                usuarioId: Number(req.auth.sub),
                rol: req.auth.rol
            });

        if (!archivo) {
            return res.status(404).json({
                error:
                    'El registro o su archivo no están disponibles.'
            });
        }

        res.download(
            archivo.rutaAbsoluta,
            archivo.nombreArchivo,
            (error) => {
                if (error && !res.headersSent) {
                    next(error);
                }
            }
        );
    } catch (error) {
        next(error);
    }
}

export async function enviarRevision(req, res, next) {
    try {
        const registroId = Number(req.params.id);

        const revisorId =
            req.body.revisor_id === undefined ||
                req.body.revisor_id === null ||
                req.body.revisor_id === ''
                ? null
                : Number(req.body.revisor_id);

        const aprobadorId = Number(
            req.body.aprobador_id
        );

        const comentario =
            typeof req.body.comentario === 'string'
                ? req.body.comentario.trim()
                : '';

        if (
            !Number.isInteger(registroId) ||
            registroId <= 0
        ) {
            return res.status(400).json({
                error: 'El registro no es válido.'
            });
        }

        if (
            revisorId !== null &&
            (
                !Number.isInteger(revisorId) ||
                revisorId <= 0
            )
        ) {
            return res.status(400).json({
                error: 'Selecciona un revisor válido.'
            });
        }

        if (
            !Number.isInteger(aprobadorId) ||
            aprobadorId <= 0
        ) {
            return res.status(400).json({
                error: 'Selecciona un aprobador válido.'
            });
        }

        if (comentario.length > 2000) {
            return res.status(400).json({
                error:
                    'El comentario debe tener máximo 2000 caracteres.'
            });
        }

        const solicitud =
            await registrosService.enviarARevision({
                registroId,
                solicitanteId: Number(req.auth.sub),
                solicitanteRol: req.auth.rol,
                revisorId,
                aprobadorId,
                comentario
            });

        res.status(201).json({
            mensaje:
                'El registro fue enviado al flujo de aprobación.',
            solicitud
        });
    } catch (error) {
        next(error);
    }
}