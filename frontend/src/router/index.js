import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import DefaultLayout from '@/layouts/DefaultLayout.vue';

const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue') },
  {
    path: '/',
    component: DefaultLayout,
    meta: { requiereAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/views/DashboardView.vue') },
      { path: 'procesos', name: 'procesos', component: () => import('@/views/ProcesosView.vue') },
      { path: 'documentos', name: 'documentos', component: () => import('@/views/DocumentosView.vue') },
      { path: 'solicitudes', name: 'solicitudes', component: () => import('@/views/SolicitudesView.vue') },
      { path: 'auditorias', name: 'auditorias', component: () => import('@/views/AuditoriasView.vue') },
      { path: 'juntas', name: 'juntas', component: () => import('@/views/JuntasView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Guarda de ruta: exige "sesión" para las vistas de la app.
router.beforeEach((to) => {
  const auth = useAuthStore();
  if (to.meta.requiereAuth && !auth.autenticado) return { name: 'login' };
  if (to.name === 'login' && auth.autenticado) return { name: 'dashboard' };
});

export default router;
