<script setup>
defineProps({ title: String, subtitle: String });
</script>

<template>
  <section class="card">
    <header v-if="title || $slots.actions" class="card-head">
      <div>
        <h3 v-if="title">{{ title }}</h3>
        <p v-if="subtitle" class="muted">{{ subtitle }}</p>
      </div>
      <div class="card-actions"><slot name="actions" /></div>
    </header>
    <div class="card-body"><slot /></div>
  </section>
</template>

<style scoped>
.card { background: var(--surface); border: 1px solid var(--border-soft); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
.card-head { display: flex; align-items: center; justify-content: space-between; padding: 16px 18px; border-bottom: 1px solid var(--border-soft); }
.card-head h3 { font-size: 15px; }
.card-head p { font-size: 12px; margin-top: 1px; }
.card-body { padding: 6px 4px; }
</style>
