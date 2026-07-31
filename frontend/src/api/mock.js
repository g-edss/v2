// Datos de ejemplo para desarrollar la interfaz sin depender del backend.
// Cuando el API esté listo, cada vista reemplaza el mock por api.get(...).

export const kpis = [
  { clave: 'documentos', etiqueta: 'Documentos activos', valor: 128, icono: 'doc', delta: '+4 este mes' },
  { clave: 'solicitudes', etiqueta: 'Solicitudes pendientes', valor: 9, icono: 'request', delta: '3 por aprobar' },
  { clave: 'auditorias', etiqueta: 'Auditorías abiertas', valor: 2, icono: 'audit', delta: '5 hallazgos activos' },
  { clave: 'juntas', etiqueta: 'Juntas próximas', valor: 3, icono: 'meeting', delta: 'Esta semana' },
];

export const actividadReciente = [
  { id: 1, tipo: 'Cambio de documento', documento: 'PRO-SDS-14 Control de registros', usuario: 'A. Torres', estado: 'en_revisor', fecha: '2026-07-16' },
  { id: 2, tipo: 'Alta de documento', documento: 'INS-SDS-07 Uso de EPP', usuario: 'M. Delgado', estado: 'aprobada', fecha: '2026-07-15' },
  { id: 3, tipo: 'Baja de documento', documento: 'REG-SDS-02 Bitácora antigua', usuario: 'L. Cárdenas', estado: 'pendiente', fecha: '2026-07-15' },
  { id: 4, tipo: 'Aprobación de registro', documento: 'Proceso: Gestión de becas', usuario: 'Admin', estado: 'aprobada', fecha: '2026-07-14' },
  { id: 5, tipo: 'Cambio de documento', documento: 'MAN-SDS-01 Manual de calidad', usuario: 'A. Torres', estado: 'rechazada', fecha: '2026-07-13' },
];

export const procesos = [
  { id: 1, nombre: 'Gestión documental', responsable: 'Ana Torres', correo: 'ana.torres@fime.uanl.mx', estatus: 'activo', creado_en: '2026-06-02' },
  { id: 2, nombre: 'Control de auditorías internas', responsable: 'Luis Cárdenas', correo: 'luis.cardenas@fime.uanl.mx', estatus: 'activo', creado_en: '2026-06-10' },
  { id: 3, nombre: 'Seguimiento de juntas', responsable: 'María Delgado', correo: 'maria.delgado@fime.uanl.mx', estatus: 'activo', creado_en: '2026-06-18' },
  { id: 4, nombre: 'Gestión de becas', responsable: 'Jorge Ramos', correo: 'jorge.ramos@fime.uanl.mx', estatus: 'inactivo', creado_en: '2026-07-01' },
];

export const documentos = [
  { id: 1, codigo: 'MAN-SDS-01', nombre: 'Manual de calidad', tipo: 'Manual de calidad', version: '3.0', origen: 'interno', estado: 'activo' },
  { id: 2, codigo: 'PRO-SDS-14', nombre: 'Control de registros', tipo: 'Procedimiento de trabajo', version: '2.1', origen: 'interno', estado: 'activo' },
  { id: 3, codigo: 'INS-SDS-07', nombre: 'Uso de equipo de protección', tipo: 'Instructivo', version: '1.0', origen: 'interno', estado: 'activo' },
  { id: 4, codigo: 'REG-SDS-02', nombre: 'Bitácora de mantenimiento', tipo: 'Registro', version: '1.4', origen: 'externo', estado: 'inactivo' },
  { id: 5, codigo: 'POL-SDS-03', nombre: 'Política de calidad', tipo: 'Política', version: '2.0', origen: 'interno', estado: 'activo' },
];

// Etiqueta legible + clase de badge para cada estado de solicitud.
export const estadoSolicitud = {
  pendiente:     { texto: 'Pendiente',    clase: 'badge-muted' },
  en_responsable:{ texto: 'Con responsable', clase: 'badge-info' },
  en_revisor:    { texto: 'En revisión',  clase: 'badge-info' },
  en_aprobador:  { texto: 'Con aprobador', clase: 'badge-info' },
  aprobada:      { texto: 'Aprobada',     clase: 'badge-ok' },
  rechazada:     { texto: 'Rechazada',    clase: 'badge-danger' },
  cancelada:     { texto: 'Cancelada',    clase: 'badge-muted' },
};
