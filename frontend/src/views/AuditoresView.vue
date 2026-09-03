<script setup>
import { ref, computed, onMounted } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import { api } from '@/api/client.js';

const usuarios = ref([]);
const auditores = ref([]);
const busqueda = ref('');
const cargando = ref(false);
const error = ref('');

async function cargarAuditores() {
  cargando.value = true;
  error.value = '';

  try {
    auditores.value = await api.get('/auditores');
  } catch {
    error.value = 'No se pudo cargar el catálogo de auditores.';
  } finally {
    cargando.value = false;
  }
}

async function cargarUsuarios() {
  try {
    const datos = await api.get('/usuarios');

    usuarios.value = datos.filter((usuario) => usuario.activo);
  } catch {
    error.value = 'No se pudieron cargar los usuarios activos.';
  }
}

onMounted(() => {
  cargarAuditores();
  cargarUsuarios();
});

const auditoresFiltrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return auditores.value;
  return auditores.value.filter((a) =>
    [a.codigo, a.nombre, a.puesto, a.correo, a.activo ? 'Activo' : 'Inactivo'].join(' ').toLowerCase().includes(t)
  );
});

/* ---------- Modal ---------- */
const modalAbierto = ref(false);
const esNuevo = ref(true);
const auditorABorrar = ref(null);

const form = ref({
  codigo: '',
  usuarioId: '',
  nombre: '',
  puesto: '',
  correo: '',
});

const guardando = ref(false);
const errorFormulario = ref('');

function abrirNuevo() {
  esNuevo.value = true;
  errorFormulario.value = '';
  form.value = {
    codigo: '',
    usuarioId: '',
    nombre: '',
    puesto: '',
    correo: '',
  };
  modalAbierto.value = true;
}

function editar(auditor) {
  esNuevo.value = false;
  errorFormulario.value = '';

  form.value = {
    id: auditor.id,
    codigo: auditor.codigo,
    usuarioId: auditor.usuario_id,
    nombre: auditor.nombre,
    puesto: auditor.puesto || '',
    correo: auditor.correo,
  };

  modalAbierto.value = true;
}

function cerrarModal() {
  modalAbierto.value = false;
  errorFormulario.value = '';
}

function seleccionarUsuario() {
  const usuario = usuarios.value.find(
    (u) => u.id === Number(form.value.usuarioId)
  );

  if (!usuario) return;

  form.value.nombre = usuario.nombre;
  form.value.puesto = usuario.puesto || '';
  form.value.correo = usuario.correo;
}

async function guardar() {
  if (!form.value.codigo.trim()) {
    errorFormulario.value = 'Ingresa el código del auditor.';
    return;
  }

  if (esNuevo.value && !form.value.usuarioId) {
    errorFormulario.value = 'Selecciona un usuario.';
    return;
  }

  const codigo = form.value.codigo.trim().toUpperCase();

  const codigoRepetido = auditores.value.some(
    (auditor) =>
      auditor.codigo.toUpperCase() === codigo &&
      auditor.id !== form.value.id
  );

  if (codigoRepetido) {
    errorFormulario.value = 'Ese código ya está asignado a otro auditor.';
    return;
  }

  guardando.value = true;
  errorFormulario.value = '';

  try {
    if (esNuevo.value) {
      await api.post('/auditores', {
        codigo,
        usuario_id: Number(form.value.usuarioId),
      });
    } else {
      await api.put(`/auditores/${form.value.id}`, { codigo });
    }

    await cargarAuditores();
    cerrarModal();
  } catch {
    errorFormulario.value =
      'No se pudo guardar el auditor. Verifica que el código no esté repetido.';
  } finally {
    guardando.value = false;
  }
}

async function confirmarBorrado() {
  if (!auditorABorrar.value) return;

  try {
    await api.del(`/auditores/${auditorABorrar.value.id}`);

    auditorABorrar.value = null;
    await cargarAuditores();
  } catch {
    alert('No se pudo desactivar el auditor. Intenta nuevamente.');
  }
}
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Auditores</h1>
        <p>Catálogo de auditores internos y su situación actual.</p>
      </div>
      <button class="btn btn-primary" @click="abrirNuevo">
        <AppIcon name="plus" :size="16" /> Nuevo auditor
      </button>
    </div>

    <BaseCard>
      <!-- Buscador -->
      <div class="toolbar">
        <label class="search-wrap">
          <AppIcon name="search" :size="15" />
          <input v-model="busqueda" type="text" placeholder="Buscar auditor…" />
        </label>
      </div>

      <!-- Tabla -->
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Correo</th>
            <th>Puesto</th>
            <th>Estatus</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in auditoresFiltrados" :key="a.id">
            <td><code>{{ a.codigo }}</code></td>
            <td><strong>{{ a.nombre }}</strong></td>
            <td class="muted">{{ a.correo }}</td>
            <td class="muted">{{ a.puesto || '—' }}</td>
            <td>
              <span class="badge" :class="a.activo ? 'badge-ok' : 'badge-muted'">
                {{ a.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="action-btn edit" title="Editar" @click="editar(a)">
                  <span aria-hidden="true">✎</span>
                </button>
                <button class="action-btn del" title="Eliminar" @click="auditorABorrar = a">
                  <AppIcon name="plus" :size="14" style="transform:rotate(45deg)" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="auditoresFiltrados.length === 0">
            <td colspan="6" class="empty-row">No hay auditores registrados.</td>
          </tr>
        </tbody>
      </table>
    </BaseCard>

    <!-- ===== MODAL AUDITOR ===== -->
    <Teleport to="body">
      <div v-if="modalAbierto" class="overlay" @click="cerrarModal">
        <div class="modal" @click.stop>
          <div class="modal-head">
            <h2>{{ esNuevo ? 'Nuevo auditor' : 'Editar auditor' }}</h2>
            <button class="modal-close" @click="cerrarModal">✕</button>
          </div>
          <div class="modal-body">
            <p v-if="errorFormulario" class="err">
              {{ errorFormulario }}
            </p>

            <label class="field">
              <span>Código del auditor</span>
              <input v-model="form.codigo" type="text" placeholder="Ej. AUD-001" required />
            </label>

            <label class="field">
              <span>Usuario</span>
              <select v-if="esNuevo" v-model="form.usuarioId" @change="seleccionarUsuario" required>
                <option value="" disabled>Selecciona un usuario</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">
                  {{ u.nombre }} — {{ u.correo }}
                </option>
              </select>

              <input v-else :value="form.nombre" type="text" readonly class="readonly" />
            </label>

            <label class="field">
              <span>Nombre</span>
              <input v-model="form.nombre" type="text" readonly class="readonly" />
            </label>

            <label class="field">
              <span>Puesto</span>
              <input v-model="form.puesto" type="text" readonly class="readonly" />
            </label>

            <label class="field">
              <span>Correo electrónico</span>
              <input v-model="form.correo" type="email" readonly class="readonly" />
            </label>


            <div class="modal-actions">
              <button class="btn btn-ghost" @click="cerrarModal">Cancelar</button>
              <button class="btn btn-primary" :disabled="guardando" @click="guardar">
                {{ guardando ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== MODAL ELIMINAR ===== -->
    <Teleport to="body">
      <div v-if="auditorABorrar" class="overlay" @click="auditorABorrar = null">
        <div class="modal modal-sm" @click.stop>
          <div class="modal-head">
            <h2>Eliminar auditor</h2>
            <button class="modal-close" @click="auditorABorrar = null">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Seguro que quieres eliminar a <strong>{{ auditorABorrar.nombre }}</strong> del catálogo? El auditor
              quedará inactivo y dejará de aparecer en el catálogo.</p>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="auditorABorrar = null">Cancelar</button>
              <button class="btn" style="background:var(--danger);color:#fff"
                @click="confirmarBorrado">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
code {
  background: var(--gray-100);
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 12px;
  color: var(--brand-800);
  font-weight: 600;
}

.toolbar {
  display: flex;
  align-items: center;
  padding: 14px 16px;
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

.empty-row {
  text-align: center;
  color: var(--gray-500);
  padding: 28px !important;
}

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

.readonly {
  background: var(--gray-100);
  color: var(--gray-500);
  cursor: not-allowed;
}
</style>
