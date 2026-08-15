<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import PerfilModal from './PerfilModal.vue';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const perfilAbierto = ref(false);

const titulos = {
  dashboard: 'Inicio', procesos: 'Procesos', documentos: 'Documentos',
  almacenRegistros: 'Almacén de Registros',
  solicitudes: 'Solicitudes', auditorias: 'Auditorías', juntas: 'Juntas',
  usuarios: 'Usuarios',
};

const titulo = computed(() => titulos[route.name] || 'WEB 360 de Calidad');

const iniciales = computed(() => {
  const n = auth.usuario?.nombre || 'U';
  return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
});

function salir() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <header class="topbar">
    <div class="crumbs">
      <span class="muted">Calidad</span>
      <span class="sep">/</span>
      <strong>{{ titulo }}</strong>
    </div>

    <div class="search">
      <AppIcon name="search" :size="16" />
      <input type="text" placeholder="Buscar documento, proceso o solicitud…" />
    </div>

    <div class="actions">
      <button class="icon-btn" title="Notificaciones">
        <AppIcon name="bell" :size="18" />
        <span class="dot"></span>
      </button>

      <!-- Avatar abre el modal de perfil -->
      <button class="user-btn" title="Mi perfil" @click="perfilAbierto = true">
        <div class="avatar">{{ iniciales }}</div>
        <div class="user-info">
          <strong>{{ auth.usuario?.nombre }}</strong>
          <small>{{ auth.usuario?.rol }}</small>
        </div>
      </button>

      <button class="icon-btn" title="Cerrar sesión" @click="salir">
        <AppIcon name="logout" :size="18" />
      </button>
    </div>
  </header>

  <!-- Modal de perfil (de la compañera, integrado) -->
  <PerfilModal v-if="perfilAbierto" @close="perfilAbierto = false" />
</template>

<style scoped>
.topbar {
  height: var(--topbar-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 20px;
  padding: 0 24px;
  position: sticky; top: 0; z-index: 5;
}
.crumbs { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.crumbs .sep { color: var(--gray-400); }

.search {
  flex: 1; max-width: 420px;
  display: flex; align-items: center; gap: 8px;
  background: var(--gray-100); border: 1px solid transparent;
  border-radius: 8px; padding: 8px 12px; color: var(--gray-500);
}
.search:focus-within { border-color: var(--brand-200); background: #fff; }
.search input { border: none; background: transparent; outline: none; flex: 1; font: inherit; font-size: 13px; color: var(--gray-900); }

.actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }

.icon-btn {
  position: relative; width: 38px; height: 38px; border-radius: 8px;
  border: none; background: transparent; color: var(--gray-500);
  display: grid; place-items: center; cursor: pointer;
}
.icon-btn:hover { background: var(--gray-100); color: var(--brand-700); }
.dot { position: absolute; top: 9px; right: 10px; width: 7px; height: 7px; border-radius: 50%; background: var(--danger); border: 2px solid #fff; }

/* Botón de usuario (abre perfil) */
.user-btn {
  display: flex; align-items: center; gap: 10px;
  padding: 4px 8px 4px 4px; border-radius: 8px;
  border: none; background: transparent; cursor: pointer;
}
.user-btn:hover { background: var(--gray-100); }

.avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--brand-700); color: #fff;
  display: grid; place-items: center; font-size: 12px; font-weight: 700;
  flex-shrink: 0;
}
.user-info { display: flex; flex-direction: column; line-height: 1.15; text-align: left; }
.user-info strong { font-size: 13px; color: var(--gray-900); }
.user-info small { font-size: 11px; color: var(--gray-500); }
</style>
