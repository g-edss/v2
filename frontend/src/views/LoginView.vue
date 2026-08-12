<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const correo = ref('');
const clave = ref('');
const error = ref('');
const cargando = ref(false);

const auth = useAuthStore();
const router = useRouter();

async function entrar() {
  error.value = '';
  cargando.value = true;

  try {
    await auth.login(correo.value, clave.value);
    router.push({ name: 'dashboard' });
  } catch {
    error.value = 'Correo o contraseña incorrectos.';
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="login">
    <div class="panel">
      <div class="brand">
        <div class="mark">
          <svg width="30" height="30" viewBox="0 0 32 32">
            <path d="M16 4l10 5v7c0 6.2-4.2 10.5-10 12.5C10.2 26.5 6 22.2 6 16V9l10-5z" fill="#fff"/>
            <path d="M11 16.5l3.2 3.2L21 13" fill="none" stroke="#1b7a43" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>WEB 360 de Calidad</h1>
        <p>Facultad de Ingeniería Mecánica y Eléctrica · UANL</p>
      </div>

      <form class="form" @submit.prevent="entrar">
        <label>
          <span>Correo institucional</span>
          <input v-model="correo" type="email" required placeholder="usuario@fime.uanl.mx" />
        </label>
        <label>
          <span>Contraseña</span>
          <input v-model="clave" type="password" required placeholder="••••••••" />
        </label>
        <button class="btn btn-primary" type="submit" :disabled="cargando">
          {{ cargando ? 'Iniciando sesión...' : 'Iniciar sesión' }}
        </button>
        <p v-if="error" class="hint" style="color: #b42318">{{ error }}</p>
        <p class="hint muted">Acceso de demostración — el login real se conecta al API.</p>
      </form>
    </div>
    <footer class="pie muted">Sistema interno de gestión de calidad · Uso confidencial</footer>
  </div>
</template>

<style scoped>
.login {
  min-height: 100vh; display: grid; place-items: center;
  background:
    radial-gradient(1200px 500px at 50% -10%, var(--brand-100), transparent),
    linear-gradient(160deg, var(--gray-100), var(--gray-200));
  padding: 24px;
}
.panel {
  width: 100%; max-width: 380px; background: #fff;
  border: 1px solid var(--border-soft); border-radius: 16px;
  box-shadow: var(--shadow-md); padding: 32px 28px;
}
.brand { text-align: center; margin-bottom: 24px; }
.mark {
  width: 56px; height: 56px; margin: 0 auto 14px; border-radius: 14px;
  background: linear-gradient(180deg, var(--brand-700), var(--brand-800));
  display: grid; place-items: center; box-shadow: var(--shadow);
}
.brand h1 { font-size: 19px; }
.brand p { font-size: 12px; color: var(--gray-500); margin-top: 4px; }

.form { display: flex; flex-direction: column; gap: 14px; }
.form label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: var(--gray-700); }
.form input {
  padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
  font: inherit; font-size: 14px; outline: none;
}
.form input:focus { border-color: var(--brand-500); box-shadow: 0 0 0 3px var(--brand-100); }
.btn-primary { justify-content: center; margin-top: 4px; padding: 11px; }
.hint { text-align: center; font-size: 11px; margin-top: 2px; }
.pie { margin-top: 20px; font-size: 11px; }
</style>
