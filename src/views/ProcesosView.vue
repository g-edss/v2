<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { procesos as mockProcesos } from '@/api/mock.js';
// import { api } from '@/api/client.js';

const procesos = ref([]);

onMounted(async () => {
  // Con el backend arriba:  procesos.value = await api.get('/procesos');
  procesos.value = mockProcesos;
});
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Procesos</h1>
        <p>Alta y consulta de procesos institucionales (solo Administrador General).</p>
      </div>
      <button class="btn btn-primary"><AppIcon name="plus" :size="16" /> Registrar proceso</button>
    </div>

    <BaseCard>
      <table class="table">
        <thead>
          <tr><th>Proceso</th><th>Responsable</th><th>Correo</th><th>Estatus</th><th>Registrado</th></tr>
        </thead>
        <tbody>
          <tr v-for="p in procesos" :key="p.id">
            <td><strong>{{ p.nombre }}</strong></td>
            <td>{{ p.responsable }}</td>
            <td class="muted">{{ p.correo }}</td>
            <td><StatusBadge :estado="p.estatus" /></td>
            <td class="muted">{{ p.creado_en }}</td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
  </div>
</template>
