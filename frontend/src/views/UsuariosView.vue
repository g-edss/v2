<script setup>
import { reactive, ref } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import { api } from '@/api/client';

const roles = [
  { clave: 'admin_general', nombre: 'Administrador General' },
  { clave: 'responsable', nombre: 'Responsable' },
  { clave: 'revisor', nombre: 'Revisor' },
  { clave: 'aprobador', nombre: 'Aprobador' },
  { clave: 'visor', nombre: 'Visor' },
  { clave: 'auditor', nombre: 'Auditor' },
];

const formulario = reactive({
  nombre: '',
  correo: '',
  puesto: '',
  rol_clave: 'responsable',
  password: '',
});

const cargando = ref(false);
const error = ref('');
const exito = ref('');

async function crearUsuario() {
  error.value = '';
  exito.value = '';
  cargando.value = true;

  try {
    const usuario = await api.post('/usuarios', formulario);
    exito.value = `Usuario creado: ${usuario.nombre} (${usuario.correo}).`;
    formulario.nombre = '';
    formulario.correo = '';
    formulario.puesto = '';
    formulario.rol_clave = 'responsable';
    formulario.password = '';
  } catch (err) {
    error.value = err.message.includes('401') || err.message.includes('403')
      ? 'Tu sesión no tiene permisos para crear usuarios. Vuelve a iniciar sesión como administrador.'
      : 'No se pudo crear el usuario. Revisa los datos e intenta de nuevo.';
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Usuarios</h1>
        <p>Registra cuentas y asigna los roles del sistema.</p>
      </div>
    </div>

    <BaseCard title="Nuevo usuario" subtitle="Las contraseñas se guardan cifradas y no se muestran después de crear la cuenta.">
      <form class="form" @submit.prevent="crearUsuario">
        <div class="form-grid">
          <label>
            <span>Nombre completo</span>
            <input v-model="formulario.nombre" required autocomplete="name" placeholder="Nombre Apellido" />
          </label>

          <label>
            <span>Correo institucional</span>
            <input v-model="formulario.correo" type="email" required autocomplete="email" placeholder="usuario@fime.uanl.mx" />
          </label>

          <label>
            <span>Puesto</span>
            <input v-model="formulario.puesto" placeholder="Puesto o área" />
          </label>

          <label>
            <span>Rol</span>
            <select v-model="formulario.rol_clave" required>
              <option v-for="rol in roles" :key="rol.clave" :value="rol.clave">{{ rol.nombre }}</option>
            </select>
          </label>

          <label class="full-width">
            <span>Contraseña temporal</span>
            <input v-model="formulario.password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo 8 caracteres" />
          </label>
        </div>

        <p v-if="error" class="message error">{{ error }}</p>
        <p v-if="exito" class="message success"><AppIcon name="check" :size="16" /> {{ exito }}</p>

        <div class="actions">
          <button class="btn btn-primary" type="submit" :disabled="cargando">
            <AppIcon name="plus" :size="16" />
            {{ cargando ? 'Creando usuario...' : 'Crear usuario' }}
          </button>
        </div>
      </form>
    </BaseCard>
  </div>
</template>

<style scoped>
.form { padding: 14px; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
label { display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: var(--gray-700); }
input, select { width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px; background: #fff; color: var(--gray-900); font: inherit; font-size: 14px; outline: none; }
input:focus, select:focus { border-color: var(--brand-500); box-shadow: 0 0 0 3px var(--brand-100); }
.full-width { grid-column: 1 / -1; }
.actions { display: flex; justify-content: flex-end; margin-top: 20px; }
.message { display: flex; align-items: center; gap: 6px; margin-top: 16px; padding: 10px 12px; border-radius: 8px; font-size: 13px; }
.error { color: #b42318; background: #fef3f2; }
.success { color: #027a48; background: #ecfdf3; }
button:disabled { cursor: wait; opacity: .7; }
@media (max-width: 720px) { .form-grid { grid-template-columns: 1fr; } }
</style>
