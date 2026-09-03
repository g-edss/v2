export const ADMIN_ROLE = 'admin_general';

const ROLE_MODULES = [
  'dashboard',
  'visorDocumental',
  'procesos',
  'documentos',
  'almacenRegistros',
  'solicitudes',
  'auditorias',
  'juntas',
  'auditores',
  'indicadores',
]

export const RUTAS_POR_ROL = {
  visor: ['dashboard', 'visorDocumental', 'almacenRegistros'],
  responsable: ROLE_MODULES,
  aprobador: ROLE_MODULES,
  revisor: ROLE_MODULES,
};

export function puedeAcceder(rolClave, nombreRuta) {
  if (!rolClave) return false;
  if (rolClave === ADMIN_ROLE) return true;

  const permitidas = RUTAS_POR_ROL[rolClave];
  if (!permitidas) return true; // rol sin restricciones configuradas aún

  return permitidas.includes(nombreRuta);
}