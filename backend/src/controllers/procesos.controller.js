// Controlador de Procesos: recibe la petición HTTP, delega en el service.
import * as procesosService from '../services/procesos.service.js';

export async function listar(_req, res, next) {
  try {
    const procesos = await procesosService.listar();
    res.json(procesos);
  } catch (err) {
    next(err);
  }
}

export async function obtener(req, res, next) {
  try {
    const proceso = await procesosService.obtenerPorId(req.params.id);
    if (!proceso) return res.status(404).json({ error: 'Proceso no encontrado' });
    res.json(proceso);
  } catch (err) {
    next(err);
  }
}

export async function crear(req, res, next) {
  try {
    // NOTA: aquí irá la validación de que el usuario es Administrador General.
    const nuevo = await procesosService.crear(req.body);
    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
}
