import jwt from 'jsonwebtoken';

export function requireAuth(req, res, next) {
  const authorization = req.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Token de autenticación requerido',
    });
  }

  const token = authorization.slice(7);

  try {
    req.auth = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({
      error: 'Token inválido o expirado',
    });
  }
}

export function requireAdmin(req, res, next) {
  if (req.auth?.rol !== 'admin_general') {
    return res.status(403).json({
      error: 'No tienes permiso para crear usuarios',
    });
  }

  next();
}