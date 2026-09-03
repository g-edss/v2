<script setup>
import { computed, ref, onMounted } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { api } from '@/api/client.js';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const esAdmin = computed(() => auth.usuario?.rol_clave === 'admin_general');

const procesos = ref([]);
const responsables = ref([]);
const cargando = ref(false);
const error = ref('');
const procesoADesactivar = ref(null);

const modalAbierto = ref(false);
const procesoEditando = ref(null);
const guardando = ref(false);
const errorFormulario = ref('');

const esEdicion = computed(() => !!procesoEditando.value);

const formulario = ref({
  nombre: '',
  responsable_id: '',
  descripcion: '',
  estatus: 'activo',
});

async function cargarProcesos() {
  cargando.value = true;
  error.value = '';

  try {
    procesos.value = await api.get('/procesos');
  } catch {
    error.value = 'No se pudieron cargar los procesos.';
  } finally {
    cargando.value = false;
  }
}

async function cargarResponsables() {
  try {
    const usuarios = await api.get('/usuarios');
    responsables.value = usuarios.filter((usuario) => usuario.activo);
  } catch {
    error.value = 'No se pudieron cargar los responsables.';
  }
}

function abrirFormulario() {
  procesoEditando.value = null;
  formulario.value = {
    nombre: '',
    responsable_id: '',
    descripcion: '',
    estatus: 'activo',
  };
  errorFormulario.value = '';
  modalAbierto.value = true;
}

function abrirEdicion(proceso) {
  procesoEditando.value = proceso;
  formulario.value = {
    nombre: proceso.nombre,
    responsable_id: proceso.responsable_id,
    descripcion: proceso.descripcion || '',
    estatus: proceso.estatus,
  };
  errorFormulario.value = '';
  modalAbierto.value = true;
}

function cerrarFormulario() {
  modalAbierto.value = false;
  procesoEditando.value = null;
  errorFormulario.value = '';
}

async function guardarProceso() {
  if (!formulario.value.nombre.trim() || !formulario.value.responsable_id) {
    errorFormulario.value = 'El nombre y el responsable son obligatorios.';
    return;
  }

  guardando.value = true;
  errorFormulario.value = '';

  const datos = {
    nombre: formulario.value.nombre.trim(),
    responsable_id: Number(formulario.value.responsable_id),
    descripcion: formulario.value.descripcion.trim(),
  };

  try {
    if (esEdicion.value) {
      await api.put(`/procesos/${procesoEditando.value.id}`, {
        ...datos,
        estatus: formulario.value.estatus,
      });
    } else {
      await api.post('/procesos', datos);
    }

    await cargarProcesos();
    cerrarFormulario();
  } catch {
    errorFormulario.value = 'No se pudo guardar el proceso. Intenta nuevamente.';
  } finally {
    guardando.value = false;
  }
}

function formatoFecha(fecha) {
  if (!fecha) return '—';

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(fecha));
}

async function confirmarDesactivacion() {
  if (!procesoADesactivar.value) return;

  try {
    await api.del(`/procesos/${procesoADesactivar.value.id}`);
    await cargarProcesos();
  } catch {
    error.value = 'No se pudo desactivar el proceso.';
  } finally {
    procesoADesactivar.value = null;
  }
}

onMounted(async () => {
  await Promise.all([cargarProcesos(), cargarResponsables()]);
});
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Procesos</h1>
        <p>Alta y consulta de procesos institucionales (solo Administrador General).</p>
      </div>
      <button v-if="esAdmin" class="btn btn-primary" @click="abrirFormulario">
        <AppIcon name="plus" :size="16" /> Registrar proceso
      </button>
    </div>

    <BaseCard>
      <table class="table">
        <thead>
          <tr>
            <th>Proceso</th>
            <th>Responsable</th>
            <th>Correo</th>
            <th>Estatus</th>
            <th>Registrado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in procesos" :key="p.id">
            <td><strong>{{ p.nombre }}</strong></td>
            <td>{{ p.responsable }}</td>
            <td class="muted">{{ p.correo }}</td>
            <td>
              <StatusBadge :estado="p.estatus" />
            </td>
            <td class="muted">{{ formatoFecha(p.creado_en) }}</td>
            <td>
              <div v-if="esAdmin" class="row-actions">
                <button class="action-btn edit" title="Editar proceso" @click="abrirEdicion(p)">
                  <span aria-hidden="true">✎</span>
                </button>

                <button class="action-btn del" title="Desactivar proceso" :disabled="p.estatus === 'inactivo'"
                  @click="procesoADesactivar = p">
                  <AppIcon name="plus" :size="14" style="transform: rotate(45deg)" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
    <Teleport to="body">
      <div v-if="modalAbierto" class="overlay" @click="cerrarFormulario">
        <form class="modal" @submit.prevent="guardarProceso" @click.stop>
          <div class="modal-head">
            <h2>{{ esEdicion ? 'Editar proceso' : 'Registrar proceso' }}</h2>
            <button class="modal-close" type="button" @click="cerrarFormulario">×</button>
          </div>

          <div class="modal-body">
            <p v-if="errorFormulario" class="error-banner">
              {{ errorFormulario }}
            </p>

            <label class="field">
              <span>Nombre del proceso</span>
              <input v-model="formulario.nombre" required placeholder="Ej. Gestión de documentos" />
            </label>

            <label class="field">
              <span>Responsable</span>
              <select v-model="formulario.responsable_id" required>
                <option disabled value="">Selecciona un responsable</option>
                <option v-for="usuario in responsables" :key="usuario.id" :value="usuario.id">
                  {{ usuario.nombre }} — {{ usuario.correo }}
                </option>
              </select>
            </label>

            <label v-if="esEdicion" class="field">
              <span>Estado</span>
              <select v-model="formulario.estatus">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>

            <label class="field">
              <span>Descripción general</span>
              <textarea v-model="formulario.descripcion" rows="4"
                placeholder="Describe el objetivo o alcance del proceso" />
            </label>

            <div class="modal-actions">
              <button class="btn btn-ghost" type="button" @click="cerrarFormulario">
                Cancelar
              </button>
              <button class="btn btn-primary" type="submit" :disabled="guardando">
                {{
                  guardando
                    ? 'Guardando...'
                    : esEdicion
                      ? 'Guardar cambios'
                      : 'Registrar proceso'
                }}
              </button>
            </div>
          </div>
        </form>
      </div>
    </Teleport>
    <Teleport to="body">
      <div v-if="procesoADesactivar" class="overlay" @click="procesoADesactivar = null">
        <div class="modal modal-sm" @click.stop>
          <div class="modal-head">
            <h2>Desactivar proceso</h2>
            <button class="modal-close" type="button" @click="procesoADesactivar = null">
              ×
            </button>
          </div>

          <div class="modal-body">
            <p>
              ¿Seguro que deseas desactivar
              <strong>{{ procesoADesactivar.nombre }}</strong>?
              El proceso se conservará, pero quedará inactivo.
            </p>

            <div class="modal-actions">
              <button class="btn btn-ghost" @click="procesoADesactivar = null">
                Cancelar
              </button>
              <button class="btn" style="background: var(--danger); color: #fff" @click="confirmarDesactivacion">
                Desactivar
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>


<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 48px 16px;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.45);
}

.modal {
  width: 100%;
  max-width: 460px;
  overflow: hidden;
  background: #fff;
  border-radius: 12px;
  box-shadow: var(--shadow-md);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  color: #fff;
  background: var(--brand-800);
}

.modal-head h2 {
  color: #fff;
  font-size: 16px;
}

.modal-close {
  border: 0;
  color: #fff;
  background: transparent;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--gray-700);
  font-size: 13px;
  font-weight: 600;
}

.field input,
.field select,
.field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--gray-900);
  font: inherit;
  font-size: 14px;
  outline: none;
  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-100);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}

.error-banner {
  padding: 10px 12px;
  border: 1px solid var(--danger);
  border-radius: 8px;
  color: var(--danger);
  background: var(--danger-bg);
  font-size: 13px;
}

.modal-sm {
  max-width: 380px;
}

.row-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  display: grid;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  place-items: center;
  transition: background 0.12s;
}

.action-btn.edit {
  color: var(--brand-700);
  background: var(--brand-100);
}

.action-btn.edit:hover {
  background: var(--brand-200);
}

.action-btn.del {
  color: var(--danger);
  background: var(--danger-bg);
}

.action-btn.del:hover:not(:disabled) {
  background: #f5c6c5;
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>