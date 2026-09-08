<script setup>
import { useRoute, useRouter } from 'vue-router';
import { computed, onMounted, ref } from 'vue';
import AppIcon from './AppIcon.vue';
import PerfilModal from './PerfilModal.vue';
import { useAuthStore } from '@/stores/auth';
import { api } from '@/api/client';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const perfilAbierto = ref(false);
const notificaciones = ref([]);
const noLeidas = ref(0);
const notificacionesAbiertas = ref(false);
const cargandoNotificaciones = ref(false);
const errorNotificaciones = ref('');

const titulos = {
  dashboard: 'Inicio',
  procesos: 'Procesos',
  visorDocumental: 'Visor Documental',
  documentos: 'Control de Documentos',
  almacenRegistros: 'Almacén de Registros',
  solicitudes: 'Solicitudes', auditorias: 'Auditorías', juntas: 'Juntas',
  usuarios: 'Usuarios',
  auditores: 'Auditores',
};

const titulo = computed(() => titulos[route.name] || 'WEB 360 de Calidad');

const iniciales = computed(() => {
  const n = auth.usuario?.nombre || 'U';
  return n.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
});

async function cargarNotificaciones() {
  cargandoNotificaciones.value = true;
  errorNotificaciones.value = '';

  try {
    const datos = await api.get('/notificaciones');

    notificaciones.value = datos.notificaciones;
    noLeidas.value = datos.no_leidas;
  } catch (error) {
    errorNotificaciones.value =
      error.message || 'No se pudieron cargar las notificaciones.';
  } finally {
    cargandoNotificaciones.value = false;
  }
}

onMounted(cargarNotificaciones);

async function alternarNotificaciones() {
  notificacionesAbiertas.value = !notificacionesAbiertas.value;

  if (notificacionesAbiertas.value) {
    await cargarNotificaciones();
  }
}

async function abrirNotificacion(notificacion) {
  errorNotificaciones.value = '';

  try {
    if (!notificacion.leida) {
      const actualizada = await api.patch(
        `/notificaciones/${notificacion.id}/leida`,
      );

      Object.assign(notificacion, actualizada);
      noLeidas.value = Math.max(0, noLeidas.value - 1);
    }

    notificacionesAbiertas.value = false;

    if (
      notificacion.enlace &&
      notificacion.enlace.startsWith('/')
    ) {
      await router.push(notificacion.enlace);
    }
  } catch (error) {
    errorNotificaciones.value =
      error.message || 'No se pudo abrir la notificación.';
  }
}

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
      <div class="notifications-wrapper">
        <button class="icon-btn" title="Notificaciones" type="button" @click="alternarNotificaciones">
          <AppIcon name="bell" :size="18" />
          <span v-if="noLeidas > 0" class="dot"></span>
        </button>

        <section v-if="notificacionesAbiertas" class="notifications-panel">
          <div class="notifications-header">
            <strong>Notificaciones</strong>
            <span>{{ noLeidas }} sin leer</span>
          </div>

          <p v-if="cargandoNotificaciones" class="notifications-message">
            Cargando notificaciones...
          </p>

          <p v-else-if="errorNotificaciones" class="notifications-message notifications-error">
            {{ errorNotificaciones }}
          </p>

          <p v-else-if="notificaciones.length === 0" class="notifications-message">
            No tienes notificaciones.
          </p>

          <ul v-else class="notifications-list">
            <li v-for="notificacion in notificaciones" :key="notificacion.id">
              <button class="notification-item" :class="{ unread: !notificacion.leida }" type="button"
                @click="abrirNotificacion(notificacion)">
                <span>{{ notificacion.mensaje }}</span>

                <small>
                  {{ notificacion.leida ? 'Leída' : 'Nueva' }}
                </small>
              </button>
            </li>
          </ul>
        </section>
      </div>

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
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 24px;
  position: sticky;
  top: 0;
  z-index: 5;
}

.crumbs {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.crumbs .sep {
  color: var(--gray-400);
}

.search {
  flex: 1;
  max-width: 420px;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gray-100);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 12px;
  color: var(--gray-500);
}

.search:focus-within {
  border-color: var(--brand-200);
  background: #fff;
}

.search input {
  border: none;
  background: transparent;
  outline: none;
  flex: 1;
  font: inherit;
  font-size: 13px;
  color: var(--gray-900);
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.icon-btn {
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--gray-500);
  display: grid;
  place-items: center;
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--gray-100);
  color: var(--brand-700);
}

.notifications-wrapper {
  position: relative;
}

.notifications-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: min(360px, calc(100vw - 32px));
  max-height: 420px;
  overflow: hidden;
  background: #fff;
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 12px 30px rgb(15 23 42 / 18%);
  z-index: 20;
}

.notifications-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

.notifications-header strong {
  color: var(--gray-900);
  font-size: 14px;
}

.notifications-header span {
  color: var(--gray-500);
  font-size: 12px;
}

.notifications-message {
  margin: 0;
  padding: 20px 16px;
  color: var(--gray-500);
  font-size: 13px;
  text-align: center;
}

.notifications-error {
  color: var(--danger);
}

.notifications-list {
  max-height: 350px;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.notifications-list li {
  border-bottom: 1px solid var(--border);
}

.notifications-list li:last-child {
  border-bottom: none;
}

.notification-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
  padding: 13px 16px;
  border: none;
  background: #fff;
  color: var(--gray-700);
  font: inherit;
  font-size: 13px;
  line-height: 1.4;
  text-align: left;
  cursor: pointer;
}

.notification-item:hover {
  background: var(--gray-100);
}

.notification-item.unread {
  background: var(--brand-50);
  color: var(--gray-900);
  font-weight: 600;
}

.notification-item.unread:hover {
  background: var(--brand-100);
}

.notification-item small {
  color: var(--gray-500);
  font-size: 11px;
  font-weight: 400;
}

.dot {
  position: absolute;
  top: 9px;
  right: 10px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--danger);
  border: 2px solid #fff;
}

/* Botón de usuario (abre perfil) */
.user-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 8px 4px 4px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
}

.user-btn:hover {
  background: var(--gray-100);
}

.avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--brand-700);
  color: #fff;
  display: grid;
  place-items: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.user-info {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
  text-align: left;
}

.user-info strong {
  font-size: 13px;
  color: var(--gray-900);
}

.user-info small {
  font-size: 11px;
  color: var(--gray-500);
}
</style>
