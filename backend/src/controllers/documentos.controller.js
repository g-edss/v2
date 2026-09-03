import * as documentosService from '../services/documentos.service.js';

export async function listarTipos(_req, res, next) {
    try {
        const tipos =
            await documentosService.listarTiposDocumento();

        res.json(tipos);
    } catch (error) {
        next(error);
    }
}

export async function listarParticipantes(_req, res, next) {
    try {
        const participantes =
            await documentosService.listarParticipantesFlujo();

        res.json(participantes);
    } catch (error) {
        next(error);
    }
}

export async function listarControl(_req, res, next) {
    try {
        const documentos =
            await documentosService.listarDocumentosControl();

        res.json(documentos);
    } catch (error) {
        next(error);
    }
}

export async function listarVisor(_req, res, next) {
    try {
        const documentos =
            await documentosService.listarDocumentosVisor();

        res.json(documentos);
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

        const version =
            typeof req.body.version === 'string'
                ? req.body.version.trim()
                : '1.0';

        const origen = req.body.origen;
        const tipoDocumentoId = Number(req.body.tipo_documento_id);

        const procesoId =
            req.body.proceso_id === undefined ||
                req.body.proceso_id === null ||
                req.body.proceso_id === ''
                ? null
                : Number(req.body.proceso_id);

        if (!nombre || nombre.length > 200) {
            return res.status(400).json({
                error:
                    'El nombre es obligatorio y debe tener máximo 200 caracteres.',
            });
        }

        if (
            !Number.isInteger(tipoDocumentoId) ||
            tipoDocumentoId <= 0
        ) {
            return res.status(400).json({
                error: 'Selecciona un tipo de documento válido.',
            });
        }

        if (!['interno', 'externo'].includes(origen)) {
            return res.status(400).json({
                error: 'Selecciona un origen válido.',
            });
        }

        if (
            procesoId !== null &&
            (!Number.isInteger(procesoId) || procesoId <= 0)
        ) {
            return res.status(400).json({
                error: 'Selecciona un proceso válido.',
            });
        }

        if (!version || version.length > 20) {
            return res.status(400).json({
                error:
                    'La versión es obligatoria y debe tener máximo 20 caracteres.',
            });
        }

        if (!req.file) {
            return res.status(400).json({
                error: 'Debes seleccionar un archivo.',
            });
        }

        const documento =
            await documentosService.crearDocumentoConArchivo({
                nombre,
                tipoDocumentoId,
                origen,
                procesoId,
                version,
                elaboradorId: Number(req.auth.sub),
                archivo: req.file,
            });

        const conversionFallida =
            documento.version_actual.estado_conversion === 'error';

        res.status(201).json({
            mensaje: conversionFallida
                ? 'El original se guardó, pero no fue posible generar el PDF.'
                : 'Documento y versión guardados correctamente.',
            documento,
        });
    } catch (error) {
        next(error);
    }
}

function obtenerIdentificadores(req) {
    const documentoId = Number(req.params.id);
    const versionId = Number(req.params.versionId);

    if (
        !Number.isInteger(documentoId) ||
        documentoId <= 0 ||
        !Number.isInteger(versionId) ||
        versionId <= 0
    ) {
        return null;
    }

    return {
        documentoId,
        versionId,
    };
}

export async function verPdf(req, res, next) {
    try {
        const identificadores = obtenerIdentificadores(req);

        if (!identificadores) {
            return res.status(400).json({
                error: 'El documento o la versión no son válidos.',
            });
        }

        const archivo =
            await documentosService.obtenerArchivoDocumento({
                ...identificadores,
                tipo: 'pdf',
                rol: req.auth.rol,
            });

        res.type('application/pdf');

        res.sendFile(archivo.rutaAbsoluta, (error) => {
            if (error && !res.headersSent) {
                next(error);
            }
        });
    } catch (error) {
        next(error);
    }
}

export async function descargarOriginal(req, res, next) {
    try {
        const identificadores = obtenerIdentificadores(req);

        if (!identificadores) {
            return res.status(400).json({
                error: 'El documento o la versión no son válidos.',
            });
        }

        const archivo =
            await documentosService.obtenerArchivoDocumento({
                ...identificadores,
                tipo: 'original',
                rol: req.auth.rol,
            });

        res.download(
            archivo.rutaAbsoluta,
            archivo.nombreDescarga,
            (error) => {
                if (error && !res.headersSent) {
                    next(error);
                }
            },
        );
    } catch (error) {
        next(error);
    }
}

export async function enviarRevision(req, res, next) {
    try {
        const identificadores = obtenerIdentificadores(req);

        if (!identificadores) {
            return res.status(400).json({
                error: 'El documento o la versión no son válidos.',
            });
        }

        function idOpcional(valor) {
            if (
                valor === undefined ||
                valor === null ||
                valor === ''
            ) {
                return null;
            }

            return Number(valor);
        }

        const responsableId = idOpcional(
            req.body.responsable_id,
        );

        const revisorId = idOpcional(
            req.body.revisor_id,
        );

        const aprobadorId = idOpcional(
            req.body.aprobador_id,
        );

        const ids = [
            responsableId,
            revisorId,
            aprobadorId,
        ].filter((id) => id !== null);

        if (
            ids.some(
                (id) =>
                    !Number.isInteger(id) ||
                    id <= 0,
            )
        ) {
            return res.status(400).json({
                error: 'Uno de los participantes no es válido.',
            });
        }

        if (aprobadorId === null) {
            return res.status(400).json({
                error: 'Debes seleccionar un aprobador.',
            });
        }

        const comentario =
            typeof req.body.comentario === 'string'
                ? req.body.comentario.trim()
                : '';

        if (comentario.length > 2000) {
            return res.status(400).json({
                error:
                    'El comentario debe tener máximo 2000 caracteres.',
            });
        }

        const solicitud =
            await documentosService.enviarARevision({
                ...identificadores,
                solicitanteId: Number(req.auth.sub),
                solicitanteRol: req.auth.rol,
                responsableId,
                revisorId,
                aprobadorId,
                comentario,
            });

        res.status(201).json({
            mensaje:
                'El documento fue enviado al flujo de revisión.',
            solicitud,
        });
    } catch (error) {
        next(error);
    }
}

export async function reemplazarCorreccion(req, res, next) {
    try {
        const documentoId = Number(req.params.id);
        const versionId = Number(req.params.versionId);

        if (
            !Number.isInteger(documentoId) ||
            documentoId <= 0 ||
            !Number.isInteger(versionId) ||
            versionId <= 0
        ) {
            return res.status(400).json({
                error: 'El documento o la versión no son válidos.',
            });
        }

        const version =
            await documentosService.reemplazarArchivoCorregido({
                documentoId,
                versionId,
                usuarioId: Number(req.auth.sub),
                usuarioRol: req.auth.rol,
                archivo: req.file,
            });

        const conversionFallida =
            version.estado_conversion === 'error';

        res.json({
            mensaje: conversionFallida
                ? 'El archivo se guardó, pero no se pudo generar el PDF.'
                : 'El archivo corregido se guardó correctamente.',
            version,
        });
    } catch (error) {
        next(error);
    }
}