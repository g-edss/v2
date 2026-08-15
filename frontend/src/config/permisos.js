export const ADMIN_ROLE = 'admin_general';

export const RUTAS_POR_ROL = {
  visor: ['dashboard', 'documentos', 'almacenRegistros'],
};

export function puedeAcceder(rolClave, nombreRuta) {
  if (!rolClave) return false;
  if (rolClave === ADMIN_ROLE) return true;

  const permitidas = RUTAS_POR_ROL[rolClave];
  if (!permitidas) return true; // rol sin restricciones configuradas aún

  return permitidas.includes(nombreRuta);
}