<script setup>
import { estadoSolicitud } from '@/api/mock.js';

const props = defineProps({
  estado: { type: String, required: true },
});

// Mapea estados conocidos; si no existe, muestra el texto crudo.
const mapa = {
  ...estadoSolicitud,
  activo: { texto: 'Activo', clase: 'badge-ok' },
  inactivo: { texto: 'Inactivo', clase: 'badge-muted' },
  borrador: { texto: 'Borrador', clase: 'badge-warn' },
  aprobado: { texto: 'Aprobado', clase: 'badge-ok' },
  en_revision: { texto: 'En revisión', clase: 'badge-warn' },
  correcciones: { texto: 'Requiere correcciones', clase: 'badge-warn' },
  vigente: { texto: 'Vigente', clase: 'badge-ok' },
  rechazado: { texto: 'Rechazado', clase: 'badge-danger' },
  obsoleto: { texto: 'Obsoleto', clase: 'badge-muted' },
  abierto: { texto: 'Abierto', clase: 'badge-warn' },
  cerrado: { texto: 'Cerrado', clase: 'badge-ok' },
};
</script>

<template>
  <span class="badge" :class="(mapa[estado] || {}).clase || 'badge-muted'">
    {{ (mapa[estado] || {}).texto || estado }}
  </span>
</template>
