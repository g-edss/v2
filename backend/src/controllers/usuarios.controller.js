import * as usuariosService from '../services/usuarios.service.js';

export async function crear(req, res, next) {
  try {
    const { nombre, correo, puesto, rol_clave, password } = req.body;

    if (
      typeof nombre !== 'string' ||
      typeof correo !== 'string' ||
      typeof rol_clave !== 'string' ||
      typeof password !== 'string' ||
      !nombre.trim() ||
      !correo.trim() ||
      !rol_clave.trim()
    ) {
      return res.status(400).json({
        error: 'Nombre, correo, rol y contraseña son obligatorios',
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      return res.status(400).json({
        error: 'El correo no tiene un formato válido',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 8 caracteres',
      });
    }

    const usuario = await usuariosService.crear({
      nombre,
      correo,
      puesto: typeof puesto === 'string' ? puesto : null,
      rol_clave,
      password,
    });

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
}