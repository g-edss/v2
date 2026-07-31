<script setup>
import { estadoSolicitud } from '@/api/mock.js';

const props = defineProps({
  estado: { type: String, required: true },
});

// Mapea estados conocidos; si no existe, muestra el texto crudo.
const mapa = {
  ...estadoSolicitud,
  activo:   { texto: 'Activo',   clase: 'badge-ok' },
  inactivo: { texto: 'Inactivo', clase: 'badge-muted' },
  abierto:  { texto: 'Abierto',  clase: 'badge-warn' },
  cerrado:  { texto: 'Cerrado',  clase: 'badge-ok' },
};
</script>

<template>
  <span class="badge" :class="(mapa[estado] || {}).clase || 'badge-muted'">
    {{ (mapa[estado] || {}).texto || estado }}
  </span>
</template>
