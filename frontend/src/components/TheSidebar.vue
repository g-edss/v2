<script setup>
import AppIcon from './AppIcon.vue';

const nav = [
  { to: '/',            label: 'Inicio',       icon: 'dashboard' },
  { to: '/procesos',    label: 'Procesos',     icon: 'process' },
  { to: '/documentos',  label: 'Documentos',   icon: 'doc' },
  { to: '/solicitudes', label: 'Solicitudes',  icon: 'request' },
  { to: '/auditorias',  label: 'Auditorías',   icon: 'audit' },
  { to: '/juntas',      label: 'Juntas',       icon: 'meeting' },
];
</script>

<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-mark">
        <svg width="24" height="24" viewBox="0 0 32 32">
          <path d="M16 4l10 5v7c0 6.2-4.2 10.5-10 12.5C10.2 26.5 6 22.2 6 16V9l10-5z"
                fill="#fff" opacity=".95"/>
          <path d="M11 16.5l3.2 3.2L21 13" fill="none" stroke="#1b7a43"
                stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <div class="brand-text">
        <strong>WEB 360</strong>
        <span>de Calidad</span>
      </div>
    </div>

    <nav class="nav">
      <RouterLink v-for="item in nav" :key="item.to" :to="item.to"
                  class="nav-item" active-class="active"
                  :exact-active-class="item.to === '/' ? 'active' : ''">
        <AppIcon :name="item.icon" :size="18" />
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>

    <div class="sidebar-foot">
      <span>FIME · UANL</span>
      <small>Subdirección de Desarrollo Sostenible</small>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-w);
  min-height: 100vh;
  background: linear-gradient(180deg, var(--brand-800) 0%, var(--brand-900) 100%);
  color: #dbeee2;
  display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0;
}
.brand {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px; height: var(--topbar-h);
  border-bottom: 1px solid rgba(255,255,255,.12);
}
.brand-mark {
  width: 38px; height: 38px; border-radius: 9px;
  background: rgba(255,255,255,.14);
  display: grid; place-items: center;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-text strong { color: #fff; font-size: 16px; letter-spacing: .02em; }
.brand-text span { font-size: 11px; color: #a9d3ba; }

.nav { padding: 14px 12px; display: flex; flex-direction: column; gap: 2px; flex: 1; }
.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px;
  color: #cfe6d8; font-weight: 500; font-size: 14px;
  transition: background .14s, color .14s;
}
.nav-item:hover { background: rgba(255,255,255,.08); color: #fff; text-decoration: none; }
.nav-item.active { background: rgba(255,255,255,.16); color: #fff; }
.nav-item.active :deep(svg) { color: #fff; }

.sidebar-foot {
  padding: 16px 20px; border-top: 1px solid rgba(255,255,255,.12);
  display: flex; flex-direction: column; gap: 2px;
}
.sidebar-foot span { font-size: 12px; color: #bfe0cd; font-weight: 600; }
.sidebar-foot small { font-size: 10px; color: #8fbda2; }
</style>
