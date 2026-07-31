import { defineStore } from 'pinia';

// Autenticación de ejemplo (mock). Reemplazar por login real contra el API.
export const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: JSON.parse(localStorage.getItem('web360_user') || 'null'),
  }),
  getters: {
    autenticado: (s) => !!s.usuario,
  },
  actions: {
    login(correo) {
      // TODO: sustituir por POST /api/auth/login
      this.usuario = { nombre: 'Administrador', correo, rol: 'Administrador General' };
      localStorage.setItem('web360_user', JSON.stringify(this.usuario));
    },
    logout() {
      this.usuario = null;
      localStorage.removeItem('web360_user');
    },
  },
});
