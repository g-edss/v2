<script setup>
import TheSidebar from '@/components/TheSidebar.vue';
import TheTopbar from '@/components/TheTopbar.vue';
</script>

<template>
  <div class="shell">
    <TheSidebar />
    <div class="main">
      <TheTopbar />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
.shell { min-height: 100vh; }
.main { margin-left: var(--sidebar-w); display: flex; flex-direction: column; min-height: 100vh; }
.content { padding: 24px; flex: 1; }
</style>
