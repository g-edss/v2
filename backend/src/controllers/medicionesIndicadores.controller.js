import * as medicionesService from '../services/medicionesIndicadores.service.js';

export async function listarPorIndicador(req, res, next) {
    try {
        const indicadorId = Number(req.params.indicadorId);

        if (!Number.isInteger(indicadorId) || indicadorId <= 0) {
            return res.status(400).json({
                error: 'El identificador del indicador no es válido',
            });
        }

        const mediciones =
            await medicionesService.listarPorIndicador(indicadorId, {
                usuario_id: req.auth.sub,
                rol: req.auth.rol,
            });

        res.json(mediciones);
    } catch (err) {
        next(err);
    }
}

export async function crear(req, res, next) {
    try {
        const indicadorId = Number(req.params.indicadorId);
        const {
            fecha_medicion,
            resultado,
            observaciones = '',
        } = req.body;

        const resultadoNumerico = Number(resultado);

        if (!Number.isInteger(indicadorId) || indicadorId <= 0) {
            return res.status(400).json({
                error: 'El identificador del indicador no es válido',
            });
        }

        if (
            typeof fecha_medicion !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(fecha_medicion)
        ) {
            return res.status(400).json({
                error: 'La fecha de medición no es válida',
            });
        }

        const fecha = new Date(`${fecha_medicion}T00:00:00Z`);

        if (
            Number.isNaN(fecha.getTime()) ||
            fecha.toISOString().slice(0, 10) !== fecha_medicion
        ) {
            return res.status(400).json({
                error: 'La fecha de medición no existe',
            });
        }

        if (
            resultado === '' ||
            resultado === null ||
            resultado === undefined ||
            !Number.isFinite(resultadoNumerico)
        ) {
            return res.status(400).json({
                error: 'El resultado debe ser un número válido',
            });
        }

        if (typeof observaciones !== 'string') {
            return res.status(400).json({
                error: 'Las observaciones no son válidas',
            });
        }

        const medicion = await medicionesService.crear({
            indicador_id: indicadorId,
            fecha_medicion,
            resultado: resultadoNumerico,
            observaciones: observaciones.trim() || null,
            capturado_por: req.auth.sub,
            rol: req.auth.rol,
        });

        res.status(201).json(medicion);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({
                error:
                    'Ya existe una medición de este indicador para esa fecha',
            });
        }

        next(err);
    }
}

export async function actualizar(req, res, next) {
    try {
        const indicadorId = Number(req.params.indicadorId);
        const medicionId = Number(req.params.medicionId);

        const {
            fecha_medicion,
            resultado,
            observaciones = '',
        } = req.body;

        const resultadoNumerico = Number(resultado);

        if (
            !Number.isInteger(indicadorId) ||
            indicadorId <= 0 ||
            !Number.isInteger(medicionId) ||
            medicionId <= 0
        ) {
            return res.status(400).json({
                error:
                    'El indicador o la medición no son válidos',
            });
        }

        if (
            typeof fecha_medicion !== 'string' ||
            !/^\d{4}-\d{2}-\d{2}$/.test(fecha_medicion)
        ) {
            return res.status(400).json({
                error: 'La fecha de medición no es válida',
            });
        }

        const fecha = new Date(
            `${fecha_medicion}T00:00:00Z`
        );

        if (
            Number.isNaN(fecha.getTime()) ||
            fecha.toISOString().slice(0, 10) !==
            fecha_medicion
        ) {
            return res.status(400).json({
                error: 'La fecha de medición no existe',
            });
        }

        if (
            resultado === '' ||
            resultado === null ||
            resultado === undefined ||
            !Number.isFinite(resultadoNumerico)
        ) {
            return res.status(400).json({
                error: 'El resultado debe ser un número válido',
            });
        }

        if (typeof observaciones !== 'string') {
            return res.status(400).json({
                error: 'Las observaciones no son válidas',
            });
        }

        const medicion = await medicionesService.actualizar(
            medicionId,
            {
                indicador_id: indicadorId,
                fecha_medicion,
                resultado: resultadoNumerico,
                observaciones:
                    observaciones.trim() || null,
                usuario_id: req.auth.sub,
                rol: req.auth.rol,
            }
        );

        res.json(medicion);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({
                error:
                    'Ya existe una medición de este indicador para esa fecha',
            });
        }

        next(err);
    }
}

export async function eliminar(req, res, next) {
    try {
        const indicadorId = Number(req.params.indicadorId);
        const medicionId = Number(req.params.medicionId);

        if (
            !Number.isInteger(indicadorId) ||
            indicadorId <= 0 ||
            !Number.isInteger(medicionId) ||
            medicionId <= 0
        ) {
            return res.status(400).json({
                error:
                    'El indicador o la medición no son válidos',
            });
        }

        const medicion = await medicionesService.eliminar(
            medicionId,
            indicadorId
        );

        res.json(medicion);
    } catch (err) {
        next(err);
    }
}