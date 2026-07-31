<script setup>
// Set de íconos SVG (sin dependencias). Uso: <AppIcon name="doc" />
const props = defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 },
});

const paths = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  process:   'M4 6h16M4 12h16M4 18h10M18 16l3 3-3 3',
  doc:       'M6 2h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zm8 1v5h5M8 13h8M8 17h6',
  request:   'M9 5h6a2 2 0 0 1 2 2v12l-5-3-5 3V7a2 2 0 0 1 2-2z',
  audit:     'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5 12l5 5',
  meeting:   'M17 20v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12 10v-2a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 12',
  bell:      'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  logout:    'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  search:    'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm5 12l5 5',
  plus:      'M12 5v14M5 12h14',
  check:     'M20 6L9 17l-5-5',
};
</script>

<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
    <path :d="paths[name] || ''" />
  </svg>
</template>
