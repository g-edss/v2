<script setup>
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Almacén de registros</h1>
        <p>Consulta de registros generados por los procesos de calidad.</p>
      </div>
    </div>

    <BaseCard title="Módulo en construcción">
      <div class="empty">
        <div class="empty-icon"><AppIcon name="doc" :size="26" /></div>
        <h3>Almacén de registros</h3>
        <p class="muted">Esta sección está lista para desarrollarse. La estructura, el
          layout y los estilos ya están disponibles; solo falta conectar los datos.</p>
      </div>
    </BaseCard>
  </div>
</template>

<style scoped>
.empty { text-align: center; padding: 48px 20px; }
.empty-icon {
  width: 60px; height: 60px; margin: 0 auto 16px; border-radius: 14px;
  background: var(--brand-100); color: var(--brand-700); display: grid; place-items: center;
}
.empty h3 { font-size: 16px; margin-bottom: 6px; }
.empty p { max-width: 420px; margin: 0 auto; font-size: 13px; }
</style>