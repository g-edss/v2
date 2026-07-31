<script setup>
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { kpis, actividadReciente } from '@/api/mock.js';
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Inicio</h1>
        <p>Resumen general del sistema de gestión de calidad.</p>
      </div>
      <button class="btn btn-primary"><AppIcon name="plus" :size="16" /> Nueva solicitud</button>
    </div>

    <!-- KPIs -->
    <div class="kpis">
      <div v-for="k in kpis" :key="k.clave" class="kpi">
        <div class="kpi-icon"><AppIcon :name="k.icono" :size="20" /></div>
        <div class="kpi-body">
          <span class="kpi-label">{{ k.etiqueta }}</span>
          <strong class="kpi-value">{{ k.valor }}</strong>
          <small class="muted">{{ k.delta }}</small>
        </div>
      </div>
    </div>

    <!-- Actividad reciente -->
    <BaseCard title="Actividad reciente" subtitle="Últimas solicitudes registradas en el sistema">
      <template #actions>
        <RouterLink to="/solicitudes" class="btn btn-ghost btn-sm">Ver todas</RouterLink>
      </template>
      <table class="table">
        <thead>
          <tr>
            <th>Tipo</th><th>Documento / Proceso</th><th>Usuario</th><th>Estado</th><th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in actividadReciente" :key="a.id">
            <td>{{ a.tipo }}</td>
            <td><strong>{{ a.documento }}</strong></td>
            <td class="muted">{{ a.usuario }}</td>
            <td><StatusBadge :estado="a.estado" /></td>
            <td class="muted">{{ a.fecha }}</td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
  </div>
</template>

<style scoped>
.kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 1000px) { .kpis { grid-template-columns: repeat(2, 1fr); } }
.kpi {
  background: var(--surface); border: 1px solid var(--border-soft);
  border-radius: var(--radius); box-shadow: var(--shadow-sm);
  padding: 18px; display: flex; gap: 14px; align-items: center;
}
.kpi-icon {
  width: 46px; height: 46px; border-radius: 11px; flex-shrink: 0;
  background: var(--brand-100); color: var(--brand-700);
  display: grid; place-items: center;
}
.kpi-body { display: flex; flex-direction: column; }
.kpi-label { font-size: 12px; color: var(--gray-500); }
.kpi-value { font-size: 26px; font-weight: 700; color: var(--gray-900); line-height: 1.1; }
.kpi-body small { font-size: 11px; margin-top: 2px; }
</style>
