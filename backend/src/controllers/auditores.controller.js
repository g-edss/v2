import * as auditoresService from '../services/auditores.service.js';

export async function listar(_req, res, next) {
  try {
    const auditores = await auditoresService.listar();
    res.json(auditores);
  } catch (error) {
    next(error);
  }
}

export async function crear(req, res, next) {
  try {
    const { codigo, usuario_id } = req.body;

    if (typeof codigo !== 'string' || !codigo.trim()) {
      return res.status(400).json({
        error: 'El código del auditor es obligatorio.',
      });
    }

    if (!Number.isInteger(Number(usuario_id))) {
      return res.status(400).json({
        error: 'Selecciona un usuario válido.',
      });
    }

    const auditor = await auditoresService.crear({
      codigo: codigo.trim(),
      usuario_id: Number(usuario_id),
    });

    res.status(201).json(auditor);
  } catch (error) {
    next(error);
  }
}

export async function actualizar(req, res, next) {
  try {
    const { codigo } = req.body;

    if (typeof codigo !== 'string' || !codigo.trim()) {
      return res.status(400).json({
        error: 'El código del auditor es obligatorio.',
      });
    }

    const auditor = await auditoresService.actualizar(req.params.id, {
      codigo: codigo.trim(),
    });

    res.json(auditor);
  } catch (error) {
    next(error);
  }
}

export async function desactivar(req, res, next) {
  try {
    const auditor = await auditoresService.desactivar(req.params.id);
    res.json(auditor);
  } catch (error) {
    next(error);
  }
}