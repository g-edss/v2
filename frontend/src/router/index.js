import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { puedeAcceder } from '@/config/permisos';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiereAuth: true },
    children: [
      { path: '',                 name: 'dashboard',        component: () => import('@/views/DashboardView.vue') },
      { path: 'procesos',         name: 'procesos',         component: () => import('@/views/ProcesosView.vue') },
      { path: 'documentos',       name: 'documentos',       component: () => import('@/views/DocumentosView.vue') },
      { path: 'almacen-registros',name: 'almacenRegistros', component: () => import('@/views/AlmacenRegistrosView.vue') },
      { path: 'solicitudes',      name: 'solicitudes',      component: () => import('@/views/SolicitudesView.vue') },
      { path: 'auditorias',       name: 'auditorias',       component: () => import('@/views/AuditoriasView.vue') },
      { path: 'juntas',           name: 'juntas',           component: () => import('@/views/JuntasView.vue') },
      { path: 'usuarios',         name: 'usuarios',         component: () => import('@/views/UsuariosView.vue') },
      { path: 'auditores',        name: 'auditores',        component: () => import('@/views/AuditoresView.vue') },
      { path: 'indicadores',      name: 'indicadores',      component: () => import('@/views/IndicadoresView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiereAuth && !auth.autenticado) return { name: 'login' };
  if (to.name === 'login' && auth.autenticado) return { name: 'dashboard' };

  if (to.meta.requiereAuth && auth.autenticado) {
    if (!puedeAcceder(auth.usuario?.rol_clave, to.name)) {
      return { name: 'dashboard' };
    }
  }
});

export default router;