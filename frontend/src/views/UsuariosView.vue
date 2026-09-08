<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import { api } from '@/api/client.js';

const usuarios = ref([
  { id: 1, nombre: 'Ana Torres', correo: 'ana.torres@fime.uanl.mx', telefono: '81 1234 5678', puesto: 'Coordinadora de Calidad', rol_clave: 'admin_general', rol: 'Administrador General', estado: 'Activo', fotoUrl: '' },
  { id: 2, nombre: 'Luis Cárdenas', correo: 'luis.cardenas@fime.uanl.mx', telefono: '81 2345 6789', puesto: 'Auditor interno', rol_clave: 'responsable', rol: 'Responsable', estado: 'Activo', fotoUrl: '' },
  { id: 3, nombre: 'María Delgado', correo: 'maria.delgado@fime.uanl.mx', telefono: '81 3456 7890', puesto: 'Aprobadora documental', rol_clave: 'aprobador', rol: 'Aprobador', estado: 'Inactivo', fotoUrl: '' },
]);

const cargando = ref(false);
const errorCarga = ref('');

async function cargarUsuarios() {
  cargando.value = true;
  errorCarga.value = '';
  try {
    const datos = await api.get('/usuarios');
    usuarios.value = datos.map((u) => ({
      ...u,
      estado: u.activo === false ? 'Inactivo' : 'Activo',
    }));
  } catch (e) {
    errorCarga.value = 'No se pudo conectar con el servidor. Mostrando datos de ejemplo.';
  } finally {
    cargando.value = false;
  }
}

onMounted(cargarUsuarios);

const ROLES = [
  { clave: 'admin_general', nombre: 'Administrador General' },
  { clave: 'responsable', nombre: 'Responsable' },
  { clave: 'revisor', nombre: 'Revisor' },
  { clave: 'aprobador', nombre: 'Aprobador' },
  { clave: 'visor', nombre: 'Visor' },
];

function nombreRol(clave) {
  return ROLES.find((r) => r.clave === clave)?.nombre || clave;
}

/* ---------- Búsqueda y paginación ---------- */
const busqueda = ref('');
const filasPorPagina = ref(10);
const pagina = ref(1);

const usuariosFiltrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return usuarios.value;
  return usuarios.value.filter((u) =>
    [u.nombre, u.correo, u.telefono, u.puesto, nombreRol(u.rol_clave), u.estado].join(' ').toLowerCase().includes(t)
  );
});

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(usuariosFiltrados.value.length / filasPorPagina.value))
);
const usuariosPagina = computed(() =>
  usuariosFiltrados.value.slice(
    (pagina.value - 1) * filasPorPagina.value,
    pagina.value * filasPorPagina.value
  )
);

/* ---------- Modal ---------- */
const modalUsuario = ref(null);
const usuarioABorrar = ref(null);
const errores = ref({});
const guardando = ref(false);

const esNuevo = computed(() => modalUsuario.value === 'nuevo');

const form = ref({
  id: null, nombre: '', correo: '', telefono: '',
  puesto: '', rol_clave: 'visor', contrasena: '', estado: 'Activo',
});

watch(modalUsuario, (val) => {
  errores.value = {};
  if (val === 'nuevo') {
    form.value = { id: null, nombre: '', correo: '', telefono: '', puesto: '', rol_clave: 'visor', contrasena: '', estado: 'Activo' };
  } else if (val && typeof val === 'object') {
    form.value = { ...val, contrasena: '' };
  }
});

function cerrarModal() { modalUsuario.value = null; errores.value = {}; }

function validar() {
  const e = {};
  if (!form.value.nombre.trim()) e.nombre = 'El nombre es obligatorio.';
  if (!form.value.correo.trim()) e.correo = 'El correo es obligatorio.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.correo)) e.correo = 'Correo inválido.';
  if (!form.value.rol_clave) e.rol_clave = 'Selecciona un rol.';
  if (esNuevo.value && !form.value.contrasena.trim()) e.contrasena = 'La contraseña es obligatoria.';
  else if (esNuevo.value && form.value.contrasena.trim().length < 8) e.contrasena = 'Debe tener al menos 8 caracteres.';
  errores.value = e;
  return Object.keys(e).length === 0;
}

async function guardar() {
  if (!validar()) return;
  guardando.value = true;

  try {
    if (esNuevo.value) {
      const nuevo = await api.post('/usuarios', {
        nombre: form.value.nombre.trim(),
        correo: form.value.correo.trim(),
        puesto: form.value.puesto.trim() || null,
        rol_clave: form.value.rol_clave,
        password: form.value.contrasena,
      });
      usuarios.value.unshift({ ...nuevo, estado: 'Activo' });
    } else {
      const actualizado = await api.put(`/usuarios/${form.value.id}`, {
        nombre: form.value.nombre.trim(),
        correo: form.value.correo.trim(),
        puesto: form.value.puesto.trim() || null,
        rol_clave: form.value.rol_clave,
        estado: form.value.estado,

        ...(form.value.contrasena.trim() ? { password: form.value.contrasena.trim() } : {}),
      });
      usuarios.value = usuarios.value.map((u) =>
        u.id === actualizado.id
          ? { ...actualizado, estado: actualizado.activo === false ? 'Inactivo' : 'Activo' }
          : u
      );
    }
    cerrarModal();
  } catch (e) {
    errores.value = {
      general: e.message?.includes('409')
        ? 'Ya existe un usuario con ese correo.'
        : 'No se pudo guardar. Verifica los datos o que tu sesión siga activa como Administrador General.',
    };
  } finally {
    guardando.value = false;
  }
}

async function confirmarBorrado() {
  if (!usuarioABorrar.value) return;

  try {
    await api.del(`/usuarios/${usuarioABorrar.value.id}`);

    usuarios.value = usuarios.value.map((u) =>
      u.id === usuarioABorrar.value.id ? { ...u, estado: 'Inactivo' } : u
    );
  } catch (e) {
    errorCarga.value = 'No se pudo desactivar el usuario. Intenta de nuevo.';
  } finally {
    usuarioABorrar.value = null;
  }
}

/* ---------- Exportar CSV ---------- */
function exportarCSV() {
  const enc = ['Nombre', 'Correo', 'Teléfono', 'Puesto', 'Rol', 'Estado'];
  const filas = usuariosFiltrados.value.map((u) => [u.nombre, u.correo, u.telefono, u.puesto, nombreRol(u.rol_clave), u.estado]);
  const txt = [enc, ...filas].map((f) => f.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + txt], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'usuarios.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}

function iniciales(nombre) {
  return (nombre || '').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Usuarios</h1>
        <p>Catálogo de usuarios del sistema y sus permisos.</p>
      </div>
      <button class="btn btn-primary" @click="modalUsuario = 'nuevo'">
        <AppIcon name="plus" :size="16" /> Nuevo usuario
      </button>
    </div>

    <div v-if="errorCarga" class="error-banner">{{ errorCarga }}</div>

    <BaseCard>
      <!-- Toolbar -->
      <div class="toolbar">
        <label class="search-wrap">
          <AppIcon name="search" :size="15" />
          <input v-model="busqueda" type="text" placeholder="Buscar…" @input="pagina = 1" />
        </label>
        <div class="toolbar-right">
          <label class="rows-select">
            Mostrar
            <select v-model.number="filasPorPagina" @change="pagina = 1">
              <option v-for="n in [5, 10, 25, 50]" :key="n" :value="n">{{ n }}</option>
            </select>
            filas
          </label>
          <button class="btn btn-ghost btn-sm" @click="exportarCSV">Exportar CSV</button>
        </div>
      </div>

      <!-- Tabla -->
      <table class="table">
        <thead>
          <tr>
            <th></th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Teléfono</th>
            <th>Puesto</th>
            <th>Rol</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="cargando">
            <td colspan="8" class="empty-row">Cargando usuarios…</td>
          </tr>
          <tr v-for="u in usuariosPagina" :key="u.id">
            <td>
              <div class="avatar-circle">{{ iniciales(u.nombre) }}</div>
            </td>
            <td><strong>{{ u.nombre }}</strong></td>
            <td class="muted">{{ u.correo }}</td>
            <td class="muted">{{ u.telefono || '—' }}</td>
            <td>{{ u.puesto || '—' }}</td>
            <td>{{ nombreRol(u.rol_clave) }}</td>
            <td>
              <span class="badge" :class="u.estado === 'Activo' ? 'badge-ok' : 'badge-muted'">
                {{ u.estado }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="action-btn edit" title="Editar" @click="modalUsuario = u">
                  <span aria-hidden="true">✎</span>
                </button>
                <button class="action-btn del" title="Desactivar" @click="usuarioABorrar = u">
                  <AppIcon name="plus" :size="14" style="transform:rotate(45deg)" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!cargando && usuariosPagina.length === 0">
            <td colspan="8" class="empty-row">No se encontraron usuarios.</td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
      <div class="pagination">
        <span class="muted">Página {{ pagina }} de {{ totalPaginas }}</span>
        <div class="row" style="gap:8px">
          <button class="btn btn-ghost btn-sm" :disabled="pagina <= 1" @click="pagina--">Anterior</button>
          <button class="btn btn-ghost btn-sm" :disabled="pagina >= totalPaginas" @click="pagina++">Siguiente</button>
        </div>
      </div>
    </BaseCard>

    <!-- ===== MODAL USUARIO ===== -->
    <Teleport to="body">
      <div v-if="modalUsuario" class="overlay" @click="cerrarModal">
        <div class="modal" @click.stop>
          <div class="modal-head">
            <h2>{{ esNuevo ? 'Nuevo usuario' : 'Editar usuario' }}</h2>
            <button class="modal-close" @click="cerrarModal">✕</button>
          </div>
          <div class="modal-body">
            <div v-if="errores.general" class="error-banner">{{ errores.general }}</div>
            <div v-else-if="Object.keys(errores).length" class="error-banner">
              Revisa los campos marcados.
            </div>

            <label class="field">
              <span>Nombre</span>
              <input v-model="form.nombre" type="text" :class="{ 'input-error': errores.nombre }" />
              <small v-if="errores.nombre" class="err">{{ errores.nombre }}</small>
            </label>

            <label class="field">
              <span>Correo electrónico</span>
              <input v-model="form.correo" type="email" :class="{ 'input-error': errores.correo }" />
              <small v-if="errores.correo" class="err">{{ errores.correo }}</small>
            </label>

            <label class="field">
              <span>Teléfono</span>
              <input v-model="form.telefono" type="tel" />
            </label>

            <label class="field">
              <span>Puesto</span>
              <input v-model="form.puesto" type="text" placeholder="Ej. Coordinador de Calidad" />
            </label>

            <label class="field">
              <span>Rol</span>
              <select v-model="form.rol_clave" :class="{ 'input-error': errores.rol_clave }">
                <option v-for="r in ROLES" :key="r.clave" :value="r.clave">{{ r.nombre }}</option>
              </select>
              <small v-if="errores.rol_clave" class="err">{{ errores.rol_clave }}</small>
            </label>

            <label class="field">
              <span>{{ esNuevo ? 'Contraseña' : 'Nueva contraseña (opcional)' }}</span>
              <input v-model="form.contrasena" type="password"
                :placeholder="esNuevo ? '' : 'Dejar en blanco para no cambiarla'"
                :class="{ 'input-error': errores.contrasena }" />
              <small v-if="errores.contrasena" class="err">{{ errores.contrasena }}</small>
            </label>

            <label v-if="!esNuevo" class="field">
              <span>Estado</span>
              <select v-model="form.estado">
                <option value="Activo">Activo</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </label>

            <div class="modal-actions">
              <button class="btn btn-ghost" @click="cerrarModal" :disabled="guardando">Cancelar</button>
              <button class="btn btn-primary" @click="guardar" :disabled="guardando">
                {{ guardando ? 'Guardando…' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== MODAL ELIMINAR ===== -->
    <Teleport to="body">
      <div v-if="usuarioABorrar" class="overlay" @click="usuarioABorrar = null">
        <div class="modal modal-sm" @click.stop>
          <div class="modal-head">
            <h2>Desactivar usuario</h2>
            <button class="modal-close" @click="usuarioABorrar = null">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Seguro que quieres desactivar a <strong>{{ usuarioABorrar.nombre }}</strong>? No podrá iniciar sesión.
              Un administrador puede reactivarlo editando su estado.</p>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="usuarioABorrar = null">Cancelar</button>
              <button class="btn" style="background:var(--danger);color:#fff"
                @click="confirmarBorrado">Desactivar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
/* Toolbar */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  flex-wrap: wrap;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gray-100);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 7px 12px;
  color: var(--gray-500);
}

.search-wrap:focus-within {
  border-color: var(--brand-200);
  background: #fff;
}

.search-wrap input {
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 13px;
}

.rows-select {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--gray-500);
}

.rows-select select {
  padding: 5px 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  font: inherit;
  font-size: 13px;
  background: #fff;
}

/* Avatar */
.avatar-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--brand-200);
  color: var(--brand-800);
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 700;
}

/* Row actions */
.row-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: grid;
  place-items: center;
  transition: background .12s;
}

.action-btn.edit {
  background: var(--brand-100);
  color: var(--brand-700);
}

.action-btn.edit:hover {
  background: var(--brand-200);
}

.action-btn.del {
  background: var(--danger-bg);
  color: var(--danger);
}

.action-btn.del:hover {
  background: #f5c6c5;
}

/* Empty */
.empty-row {
  text-align: center;
  color: var(--gray-500);
  padding: 28px !important;
}

/* Paginación */
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-top: 1px solid var(--border-soft);
  font-size: 13px;
}

/* Modal */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .45);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  z-index: 100;
  overflow-y: auto;
}

.modal {
  background: #fff;
  border-radius: 12px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.modal-sm {
  max-width: 360px;
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--brand-800);
  color: #fff;
}

.modal-head h2 {
  font-size: 15px;
  color: #fff;
}

.modal-close {
  background: transparent;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

/* Campos */
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-700);
}

.field input,
.field select {
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  outline: none;
}

.field input:focus,
.field select:focus {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-100);
}

.input-error {
  border-color: var(--danger) !important;
}

.err {
  color: var(--danger);
  font-weight: 400;
  font-size: 12px;
}

.error-banner {
  background: var(--danger-bg);
  border: 1px solid var(--danger);
  color: var(--danger);
  border-radius: 6px;
  padding: 9px 12px;
  font-size: 13px;
}
</style>