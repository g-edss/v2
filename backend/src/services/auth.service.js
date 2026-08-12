import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';

export async function iniciarSesion({ correo, password }) {
  const correoNormalizado = correo.trim().toLowerCase();

  const { rows } = await query(
    `SELECT u.id, u.nombre, u.correo, u.password_hash, r.clave AS rol_clave, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE LOWER(u.correo) = $1
        AND u.activo = TRUE`,
    [correoNormalizado]
  );

  const usuario = rows[0];

  if (!usuario || !usuario.password_hash) {
    return null;
  }

  const contraseñaCorrecta = await bcrypt.compare(password, usuario.password_hash);

  if (!contraseñaCorrecta) {
    return null;
  }

  const token = jwt.sign(
    { sub: usuario.id, rol: usuario.rol_clave },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      rol_clave: usuario.rol_clave,
    },
  };
}
