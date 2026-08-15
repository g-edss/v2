<script setup>
import { ref, computed } from 'vue';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';

/* ---------- Datos de ejemplo ---------- */
const usuarios = ref([
  { id: 1, nombre: 'Ana Torres',      departamento: 'Calidad',          correo: 'ana.torres@fime.uanl.mx' },
  { id: 2, nombre: 'Luis Cárdenas',   departamento: 'Producción',       correo: 'luis.cardenas@fime.uanl.mx' },
  { id: 3, nombre: 'María Delgado',   departamento: 'Recursos Humanos', correo: 'maria.delgado@fime.uanl.mx' },
  { id: 4, nombre: 'Jorge Ramos',     departamento: 'Administración',   correo: 'jorge.ramos@fime.uanl.mx' },
]);

const auditores = ref([]);
const busqueda  = ref('');

const auditoresFiltrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return auditores.value;
  return auditores.value.filter((a) =>
    [a.codigo, a.nombre, a.departamento, a.correo, a.situacion].join(' ').toLowerCase().includes(t)
  );
});

/* ---------- Modal ---------- */
const modalAbierto = ref(false);
const esNuevo      = ref(true);
const auditorABorrar = ref(null);

const form = ref({ id: null, codigo: '', usuarioId: '', nombre: '', departamento: '', correo: '', situacion: 'Libre' });

function abrirNuevo() {
  esNuevo.value = true;
  form.value = { id: null, codigo: '', usuarioId: '', nombre: '', departamento: '', correo: '', situacion: 'Libre' };
  modalAbierto.value = true;
}

function editar(auditor) {
  esNuevo.value = false;
  form.value = { ...auditor };
  modalAbierto.value = true;
}

function cerrarModal() { modalAbierto.value = false; }

function seleccionarUsuario() {
  const u = usuarios.value.find((u) => u.id === Number(form.value.usuarioId));
  if (!u) return;
  form.value.nombre       = u.nombre;
  form.value.departamento = u.departamento;
  form.value.correo       = u.correo;
}

function guardar() {
  if (!form.value.usuarioId) { alert('Selecciona un usuario.'); return; }
  if (!form.value.codigo.trim()) { alert('Ingresa el código del auditor.'); return; }

  if (esNuevo.value) {
    auditores.value.push({ ...form.value, id: Date.now(), usuarioId: Number(form.value.usuarioId) });
  } else {
    auditores.value = auditores.value.map((a) =>
      a.id === form.value.id ? { ...form.value, usuarioId: Number(form.value.usuarioId) } : a
    );
  }
  cerrarModal();
}

function confirmarBorrado() {
  if (!auditorABorrar.value) return;
  auditores.value = auditores.value.filter((a) => a.id !== auditorABorrar.value.id);
  auditorABorrar.value = null;
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
            <th>Departamento</th>
            <th>Correo</th>
            <th>Situación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in auditoresFiltrados" :key="a.id">
            <td><code>{{ a.codigo }}</code></td>
            <td><strong>{{ a.nombre }}</strong></td>
            <td class="muted">{{ a.departamento }}</td>
            <td class="muted">{{ a.correo }}</td>
            <td>
              <span class="badge" :class="a.situacion === 'Libre' ? 'badge-ok' : 'badge-warn'">
                {{ a.situacion }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="action-btn edit" title="Editar" @click="editar(a)">
                  <AppIcon name="check" :size="14" />
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

            <label class="field">
              <span>Código del auditor</span>
              <input v-model="form.codigo" type="text" placeholder="Ej. AUD-001" required />
            </label>

            <label class="field">
              <span>Usuario</span>
              <select v-model="form.usuarioId" @change="seleccionarUsuario" required>
                <option value="" disabled>Selecciona un usuario</option>
                <option v-for="u in usuarios" :key="u.id" :value="u.id">{{ u.nombre }}</option>
              </select>
            </label>

            <label class="field">
              <span>Nombre</span>
              <input v-model="form.nombre" type="text" readonly class="readonly" />
            </label>

            <label class="field">
              <span>Departamento</span>
              <input v-model="form.departamento" type="text" readonly class="readonly" />
            </label>

            <label class="field">
              <span>Correo electrónico</span>
              <input v-model="form.correo" type="email" readonly class="readonly" />
            </label>

            <label class="field">
              <span>Situación</span>
              <select v-model="form.situacion">
                <option value="Libre">Libre</option>
                <option value="En labores">En labores</option>
              </select>
            </label>

            <div class="modal-actions">
              <button class="btn btn-ghost" @click="cerrarModal">Cancelar</button>
              <button class="btn btn-primary" @click="guardar">Guardar</button>
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
            <p>¿Seguro que quieres eliminar a <strong>{{ auditorABorrar.nombre }}</strong> del catálogo? Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="auditorABorrar = null">Cancelar</button>
              <button class="btn" style="background:var(--danger);color:#fff" @click="confirmarBorrado">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
code { background: var(--gray-100); padding: 2px 7px; border-radius: 5px; font-size: 12px; color: var(--brand-800); font-weight: 600; }

.toolbar {
  display: flex; align-items: center; padding: 14px 16px;
}
.search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: var(--gray-100); border: 1px solid transparent;
  border-radius: 8px; padding: 7px 12px; color: var(--gray-500);
}
.search-wrap:focus-within { border-color: var(--brand-200); background: #fff; }
.search-wrap input { border: none; background: transparent; outline: none; font: inherit; font-size: 13px; }

.row-actions { display: flex; gap: 6px; }
.action-btn {
  width: 28px; height: 28px; border-radius: 6px;
  border: none; cursor: pointer; display: grid; place-items: center;
}
.action-btn.edit { background: var(--brand-100); color: var(--brand-700); }
.action-btn.edit:hover { background: var(--brand-200); }
.action-btn.del { background: var(--danger-bg); color: var(--danger); }
.action-btn.del:hover { background: #f5c6c5; }

.empty-row { text-align: center; color: var(--gray-500); padding: 28px !important; }

.overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 48px 16px; z-index: 100; overflow-y: auto;
}
.modal {
  background: #fff; border-radius: 12px; width: 100%; max-width: 420px;
  box-shadow: var(--shadow-md); overflow: hidden;
}
.modal-sm { max-width: 360px; }
.modal-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; background: var(--brand-800); color: #fff;
}
.modal-head h2 { font-size: 15px; color: #fff; }
.modal-close { background: transparent; border: none; color: #fff; font-size: 16px; cursor: pointer; }
.modal-body { padding: 20px; display: flex; flex-direction: column; gap: 14px; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 4px; }

.field { display: flex; flex-direction: column; gap: 5px; font-size: 13px; font-weight: 600; color: var(--gray-700); }
.field input, .field select {
  padding: 9px 10px; border: 1px solid var(--border); border-radius: 7px;
  font: inherit; font-size: 14px; font-weight: 400; outline: none;
}
.field input:focus, .field select:focus { border-color: var(--brand-500); box-shadow: 0 0 0 3px var(--brand-100); }
.readonly { background: var(--gray-100); color: var(--gray-500); cursor: not-allowed; }
</style>
