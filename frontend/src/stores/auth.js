import { defineStore } from 'pinia';
import { api } from '@/api/client';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    usuario: JSON.parse(localStorage.getItem('web360_user') || 'null'),
    token: localStorage.getItem('web360_token'),
  }),

  getters: {
    autenticado: (state) => !!state.token,
  },

  actions: {
    async login(correo, password) {
      const { token, usuario } = await api.post('/auth/login', {
        correo,
        password,
      });

      this.token = token;
      this.usuario = usuario;

      localStorage.setItem('web360_token', token);
      localStorage.setItem('web360_user', JSON.stringify(usuario));
    },

    logout() {
      this.token = null;
      this.usuario = null;

      localStorage.removeItem('web360_token');
      localStorage.removeItem('web360_user');
    },
  },
});