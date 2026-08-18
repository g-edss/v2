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
    const { nombre, responsable_id, descripcion } = req.body;

    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      !Number.isInteger(Number(responsable_id))
    ) {
      return res.status(400).json({
        error: 'Nombre y responsable son obligatorios',
      });
    }

    const nuevo = await procesosService.crear({
      nombre: nombre.trim(),
      responsable_id: Number(responsable_id),
      descripcion: typeof descripcion === 'string' ? descripcion.trim() || null : null,
      creado_por: req.auth.sub,
    });

    res.status(201).json(nuevo);
  } catch (err) {
    next(err);
  }
}

export async function actualizar(req, res, next) {
  try {
    const { nombre, responsable_id, descripcion, estatus } = req.body;

    if (
      typeof nombre !== 'string' ||
      !nombre.trim() ||
      !Number.isInteger(Number(responsable_id))
    ) {
      return res.status(400).json({
        error: 'Nombre y responsable son obligatorios',
      });
    }

    if (!['activo', 'inactivo'].includes(estatus)) {
      return res.status(400).json({
        error: 'El estatus debe ser activo o inactivo',
      });
    }

    const proceso = await procesosService.actualizar(req.params.id, {
      nombre: nombre.trim(),
      responsable_id: Number(responsable_id),
      descripcion: typeof descripcion === 'string' ? descripcion.trim() || null : null,
      estatus,
    });

    res.json(proceso);
  } catch (err) {
    next(err);
  }
}

export async function desactivar(req, res, next) {
  try {
    const proceso = await procesosService.desactivar(req.params.id);
    res.json(proceso);
  } catch (err) {
    next(err);
  }
}