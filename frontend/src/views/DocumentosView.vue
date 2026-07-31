<script setup>
import { ref, onMounted } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { documentos as mockDocs } from '@/api/mock.js';

const documentos = ref([]);
onMounted(() => { documentos.value = mockDocs; });
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Documentos</h1>
        <p>Documentos controlados del sistema de calidad.</p>
      </div>
      <button class="btn btn-primary"><AppIcon name="plus" :size="16" /> Alta de documento</button>
    </div>

    <BaseCard>
      <table class="table">
        <thead>
          <tr><th>Código</th><th>Nombre</th><th>Tipo</th><th>Versión</th><th>Origen</th><th>Estado</th></tr>
        </thead>
        <tbody>
          <tr v-for="d in documentos" :key="d.id">
            <td><code>{{ d.codigo }}</code></td>
            <td><strong>{{ d.nombre }}</strong></td>
            <td class="muted">{{ d.tipo }}</td>
            <td>v{{ d.version }}</td>
            <td class="muted">{{ d.origen }}</td>
            <td><StatusBadge :estado="d.estado" /></td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
  </div>
</template>

<style scoped>
code { background: var(--gray-100); padding: 2px 7px; border-radius: 5px; font-size: 12px; color: var(--brand-800); font-weight: 600; }
</style>
