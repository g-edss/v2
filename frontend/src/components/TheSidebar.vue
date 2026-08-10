<script setup>
import { ref } from 'vue';
import AppIcon from './AppIcon.vue';

// Submenús desplegables
const catalogosAbierto = ref(false);

const props = defineProps({
  vistaActual: { type: String, default: '' },
});
</script>

<template>
  <aside class="sidebar">

    <!-- Marca -->
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

    <!-- Navegación -->
    <nav class="nav">

      <!-- Accesos directos -->
      <RouterLink to="/" class="nav-item" exact-active-class="active">
        <AppIcon name="dashboard" :size="18" />
        <span>Inicio</span>
      </RouterLink>

      <RouterLink to="/documentos" class="nav-item" active-class="active">
        <AppIcon name="doc" :size="18" />
        <span>Visor Documental</span>
      </RouterLink>

      <!-- Separador -->
      <div class="nav-section">MÓDULOS</div>

      <!-- Control General (submenú) -->
      <button class="nav-item nav-item--btn"
              :class="{ active: catalogosAbierto }"
              @click="catalogosAbierto = !catalogosAbierto">
        <AppIcon name="dashboard" :size="18" />
        <span>Control General</span>
        <svg class="chevron" :class="{ rotado: catalogosAbierto }"
             width="14" height="14" viewBox="0 0 24 24"
             fill="none" stroke="currentColor" stroke-width="2"
             stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <div v-if="catalogosAbierto" class="submenu">
        <RouterLink to="/usuarios" class="sub-item" active-class="active">
          <AppIcon name="meeting" :size="15" />
          Catálogo de Usuarios
        </RouterLink>
        <RouterLink to="/procesos" class="sub-item" active-class="active">
          <AppIcon name="process" :size="15" />
          Catálogo de Procesos
        </RouterLink>
      </div>

      <!-- Módulos principales -->
      <RouterLink to="/documentos" class="nav-item" active-class="active">
        <AppIcon name="doc" :size="18" />
        <span>Control de Documentos</span>
      </RouterLink>

      <RouterLink to="/solicitudes" class="nav-item" active-class="active">
        <AppIcon name="request" :size="18" />
        <span>Solicitudes y Cambios</span>
      </RouterLink>

      <RouterLink to="/auditorias" class="nav-item" active-class="active">
        <AppIcon name="audit" :size="18" />
        <span>Auditorías</span>
      </RouterLink>

      <RouterLink to="/juntas" class="nav-item" active-class="active">
        <AppIcon name="meeting" :size="18" />
        <span>Juntas y Sesiones</span>
      </RouterLink>

    </nav>

    <!-- Pie -->
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
  overflow-y: auto;
}

/* Marca */
.brand {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px; height: var(--topbar-h);
  border-bottom: 1px solid rgba(255,255,255,.12);
  flex-shrink: 0;
}
.brand-mark {
  width: 38px; height: 38px; border-radius: 9px;
  background: rgba(255,255,255,.14);
  display: grid; place-items: center;
}
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-text strong { color: #fff; font-size: 16px; letter-spacing: .02em; }
.brand-text span { font-size: 11px; color: #a9d3ba; }

/* Nav */
.nav {
  padding: 14px 12px;
  display: flex; flex-direction: column; gap: 2px;
  flex: 1;
}

.nav-section {
  font-size: 10px; font-weight: 700; letter-spacing: .08em;
  color: #7aad90; padding: 14px 12px 6px;
  text-transform: uppercase;
}

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px;
  color: #cfe6d8; font-weight: 500; font-size: 14px;
  transition: background .14s, color .14s;
  text-decoration: none;
}
.nav-item:hover { background: rgba(255,255,255,.08); color: #fff; }
.nav-item.active { background: rgba(255,255,255,.16); color: #fff; }

/* Botón de submenú (no es RouterLink) */
.nav-item--btn {
  width: 100%; border: none; background: transparent;
  cursor: pointer; font-family: inherit;
}
.nav-item--btn.active { background: rgba(255,255,255,.08); }

.chevron {
  margin-left: auto; color: #7aad90;
  transition: transform .2s;
}
.chevron.rotado { transform: rotate(180deg); }

/* Submenú */
.submenu {
  display: flex; flex-direction: column; gap: 1px;
  margin: 2px 0 4px 16px;
  padding-left: 12px;
  border-left: 1px solid rgba(255,255,255,.15);
}
.sub-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 7px;
  color: #b0d4bf; font-size: 13px;
  text-decoration: none;
  transition: background .14s, color .14s;
}
.sub-item:hover { background: rgba(255,255,255,.08); color: #fff; }
.sub-item.active { color: #fff; background: rgba(255,255,255,.12); }

/* Pie */
.sidebar-foot {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,.12);
  display: flex; flex-direction: column; gap: 2px;
  flex-shrink: 0;
}
.sidebar-foot span { font-size: 12px; color: #bfe0cd; font-weight: 600; }
.sidebar-foot small { font-size: 10px; color: #8fbda2; }
</style>
