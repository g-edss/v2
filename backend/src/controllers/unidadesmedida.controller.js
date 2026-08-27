import * as unidadesService from '../services/unidadesmedida.service.js';

export async function listar(_req, res, next) {
  try {
    const unidades = await unidadesService.listarActivas();
    res.json(unidades);
  } catch (err) {
    next(err);
  }
}