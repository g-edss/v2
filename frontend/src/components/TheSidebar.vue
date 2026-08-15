<script setup>
import { ref, computed } from 'vue';
import AppIcon from './AppIcon.vue';
import { useAuthStore } from '@/stores/auth';
import { puedeAcceder } from '@/config/permisos';

const catalogosAbierto = ref(false);
const auth = useAuthStore();

function mostrar(ruta) {
  return puedeAcceder(auth.usuario?.rol_clave, ruta);
}

const haySubmenu = computed(() =>
  ['usuarios', 'procesos', 'auditores', 'indicadores'].some(mostrar)
);
</script>

<template>
  <aside class="sidebar">

    <div class="brand">
      <!-- ...igual que antes... -->
    </div>

    <nav class="nav">

      <RouterLink v-if="mostrar('dashboard')" to="/" class="nav-item" exact-active-class="active">
        <AppIcon name="dashboard" :size="18" /><span>Inicio</span>
      </RouterLink>

      <RouterLink v-if="mostrar('documentos')" to="/documentos" class="nav-item" active-class="active">
        <AppIcon name="doc" :size="18" /><span>Visor Documental</span>
      </RouterLink>

      <div v-if="haySubmenu" class="nav-section">MÓDULOS</div>

      <!-- Control General (submenú) -->
      <button v-if="haySubmenu" class="nav-item nav-item--btn" :class="{ active: catalogosAbierto }"
              @click="catalogosAbierto = !catalogosAbierto">
        <AppIcon name="dashboard" :size="18" /><span>Control General</span>
        <svg class="chevron" :class="{ rotado: catalogosAbierto }"
             width="14" height="14" viewBox="0 0 24 24" fill="none"
             stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      <div v-if="haySubmenu && catalogosAbierto" class="submenu">
        <RouterLink v-if="mostrar('usuarios')"    to="/usuarios"    class="sub-item" active-class="active">
          <AppIcon name="meeting" :size="15" /> Catálogo de Usuarios
        </RouterLink>
        <RouterLink v-if="mostrar('procesos')"    to="/procesos"    class="sub-item" active-class="active">
          <AppIcon name="process" :size="15" /> Catálogo de Procesos
        </RouterLink>
        <RouterLink v-if="mostrar('auditores')"   to="/auditores"   class="sub-item" active-class="active">
          <AppIcon name="audit" :size="15" /> Catálogo de Auditores
        </RouterLink>
        <RouterLink v-if="mostrar('indicadores')" to="/indicadores" class="sub-item" active-class="active">
          <AppIcon name="doc" :size="15" /> Catálogo de Indicadores
        </RouterLink>
      </div>

      <RouterLink v-if="mostrar('documentos')" to="/documentos"  class="nav-item" active-class="active">
        <AppIcon name="doc" :size="18" /><span>Control de Documentos</span>
      </RouterLink>

      <RouterLink v-if="mostrar('almacenRegistros')" to="/almacen-registros" class="nav-item" active-class="active">
        <AppIcon name="doc" :size="18" /><span>Almacén de Registros</span>
      </RouterLink>

      <RouterLink v-if="mostrar('solicitudes')" to="/solicitudes" class="nav-item" active-class="active">
        <AppIcon name="request" :size="18" /><span>Solicitudes y Cambios</span>
      </RouterLink>

      <RouterLink v-if="mostrar('auditorias')" to="/auditorias"  class="nav-item" active-class="active">
        <AppIcon name="audit" :size="18" /><span>Auditorías</span>
      </RouterLink>

      <RouterLink v-if="mostrar('juntas')" to="/juntas" class="nav-item" active-class="active">
        <AppIcon name="meeting" :size="18" /><span>Juntas y Sesiones</span>
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
  width: var(--sidebar-w); min-height: 100vh;
  background: linear-gradient(180deg, var(--brand-800) 0%, var(--brand-900) 100%);
  color: #dbeee2; display: flex; flex-direction: column;
  position: fixed; top: 0; left: 0; overflow-y: auto;
}
.brand {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 20px; height: var(--topbar-h);
  border-bottom: 1px solid rgba(255,255,255,.12); flex-shrink: 0;
}
.brand-mark { width: 38px; height: 38px; border-radius: 9px; background: rgba(255,255,255,.14); display: grid; place-items: center; }
.brand-text { display: flex; flex-direction: column; line-height: 1.1; }
.brand-text strong { color: #fff; font-size: 16px; letter-spacing: .02em; }
.brand-text span { font-size: 11px; color: #a9d3ba; }

.nav { padding: 14px 12px; display: flex; flex-direction: column; gap: 2px; flex: 1; }
.nav-section { font-size: 10px; font-weight: 700; letter-spacing: .08em; color: #7aad90; padding: 14px 12px 6px; text-transform: uppercase; }

.nav-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 8px;
  color: #cfe6d8; font-weight: 500; font-size: 14px;
  transition: background .14s, color .14s; text-decoration: none;
}
.nav-item:hover { background: rgba(255,255,255,.08); color: #fff; }
.nav-item.active { background: rgba(255,255,255,.16); color: #fff; }
.nav-item--btn { width: 100%; border: none; background: transparent; cursor: pointer; font-family: inherit; }
.nav-item--btn.active { background: rgba(255,255,255,.08); }

.chevron { margin-left: auto; color: #7aad90; transition: transform .2s; }
.chevron.rotado { transform: rotate(180deg); }

.submenu { display: flex; flex-direction: column; gap: 1px; margin: 2px 0 4px 16px; padding-left: 12px; border-left: 1px solid rgba(255,255,255,.15); }
.sub-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 7px;
  color: #b0d4bf; font-size: 13px; text-decoration: none;
  transition: background .14s, color .14s;
}
.sub-item:hover { background: rgba(255,255,255,.08); color: #fff; }
.sub-item.active { color: #fff; background: rgba(255,255,255,.12); }

.sidebar-foot { padding: 16px 20px; border-top: 1px solid rgba(255,255,255,.12); display: flex; flex-direction: column; gap: 2px; flex-shrink: 0; }
.sidebar-foot span { font-size: 12px; color: #bfe0cd; font-weight: 600; }
.sidebar-foot small { font-size: 10px; color: #8fbda2; }
</style>
