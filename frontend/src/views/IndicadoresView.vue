<script setup>
import { ref, computed } from 'vue';
import { Pencil, Trash2 } from 'lucide-vue-next';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';

/* ---------- Datos ---------- */
const indicadores   = ref([]);
const busqueda      = ref('');
const filasPorPagina = ref(10);
const pagina        = ref(1);

const PROCESOS    = ['Planeación Estratégica', 'Servicio al Cliente', 'Logística', 'Auditoría', 'Recursos Humanos', 'Gestión de Calidad'];
const FRECUENCIAS = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];

/* ---------- Filtrado y paginación ---------- */
const indicadoresFiltrados = computed(() => {
  const t = busqueda.value.trim().toLowerCase();
  if (!t) return indicadores.value;
  return indicadores.value.filter((i) =>
    [i.codigo, i.nombre, i.proceso, i.responsable].join(' ').toLowerCase().includes(t)
  );
});

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(indicadoresFiltrados.value.length / filasPorPagina.value))
);
const indicadoresPagina = computed(() =>
  indicadoresFiltrados.value.slice(
    (pagina.value - 1) * filasPorPagina.value,
    pagina.value * filasPorPagina.value
  )
);

/* ---------- Modal ---------- */
const modalAbierto  = ref(false);
const esNuevo       = ref(true);
const indicadorABorrar = ref(null);

const form = ref({ id: null, codigo: '', nombre: '', proceso: '', responsable: '', frecuencia: '', meta: '', activo: true });

function abrirNuevo() {
  esNuevo.value = true;
  form.value = { id: null, codigo: '', nombre: '', proceso: '', responsable: '', frecuencia: '', meta: '', activo: true };
  modalAbierto.value = true;
}

function editar(ind) {
  esNuevo.value = false;
  form.value = { ...ind };
  modalAbierto.value = true;
}

function cerrarModal() { modalAbierto.value = false; }

function guardar() {
  if (esNuevo.value) {
    indicadores.value.push({ ...form.value, id: Date.now() });
  } else {
    indicadores.value = indicadores.value.map((i) => i.id === form.value.id ? { ...form.value } : i);
  }
  cerrarModal();
}

function confirmarBorrado() {
  if (!indicadorABorrar.value) return;
  indicadores.value = indicadores.value.filter((i) => i.id !== indicadorABorrar.value.id);
  indicadorABorrar.value = null;
}

/* ---------- Exportar CSV ---------- */
function exportarCSV() {
  const enc  = ['Código', 'Nombre', 'Proceso', 'Responsable', 'Frecuencia', 'Meta', 'Estado'];
  const filas = indicadoresFiltrados.value.map((i) =>
    [i.codigo, i.nombre, i.proceso, i.responsable, i.frecuencia, i.meta, i.activo ? 'Activo' : 'No Activo']
  );
  const txt = [enc, ...filas].map((f) => f.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob(['\uFEFF' + txt], { type: 'text/csv;charset=utf-8;' }));
  a.download = 'indicadores.csv';
  a.click();
  URL.revokeObjectURL(a.href);
}
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Indicadores</h1>
        <p>Catálogo de indicadores de desempeño por proceso.</p>
      </div>
      <button class="btn btn-primary" @click="abrirNuevo">
        <AppIcon name="plus" :size="16" /> Nuevo indicador
      </button>
    </div>

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
              <option v-for="n in [10, 25, 50]" :key="n" :value="n">{{ n }}</option>
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
            <th>Código</th>
            <th>Nombre</th>
            <th>Proceso</th>
            <th>Responsable</th>
            <th>Frecuencia</th>
            <th>Meta</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ind in indicadoresPagina" :key="ind.id">
            <td><code>{{ ind.codigo }}</code></td>
            <td><strong>{{ ind.nombre }}</strong></td>
            <td class="muted">{{ ind.proceso }}</td>
            <td class="muted">{{ ind.responsable }}</td>
            <td class="muted">{{ ind.frecuencia }}</td>
            <td>{{ ind.meta }}</td>
            <td>
              <span class="badge" :class="ind.activo ? 'badge-ok' : 'badge-muted'">
                {{ ind.activo ? 'Activo' : 'No Activo' }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="action-btn edit" title="Editar" @click="editar(ind)">
                  <Pencil :size="14" />
                </button>
                <button class="action-btn del" title="Eliminar" @click="indicadorABorrar = ind">
                  <Trash2 :size="14" />
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="indicadoresPagina.length === 0">
            <td colspan="8" class="empty-row">No se encontraron indicadores.</td>
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

    <!-- ===== MODAL INDICADOR ===== -->
    <Teleport to="body">
      <div v-if="modalAbierto" class="overlay" @click="cerrarModal">
        <div class="modal" @click.stop>
          <div class="modal-head">
            <h2>{{ esNuevo ? 'Nuevo indicador' : 'Editar indicador' }}</h2>
            <button class="modal-close" @click="cerrarModal">✕</button>
          </div>
          <div class="modal-body">

            <label class="field">
              <span>Código</span>
              <input v-model="form.codigo" type="text" placeholder="Ej. IND-001" required />
            </label>

            <label class="field">
              <span>Nombre del indicador</span>
              <input v-model="form.nombre" type="text" placeholder="Ej. Cumplimiento de objetivos" required />
            </label>

            <label class="field">
              <span>Proceso</span>
              <select v-model="form.proceso" required>
                <option value="" disabled>Selecciona un proceso</option>
                <option v-for="p in PROCESOS" :key="p" :value="p">{{ p }}</option>
              </select>
            </label>

            <label class="field">
              <span>Responsable</span>
              <input v-model="form.responsable" type="text" placeholder="Ej. Gerencia" required />
            </label>

            <label class="field">
              <span>Frecuencia</span>
              <select v-model="form.frecuencia" required>
                <option value="" disabled>Selecciona una frecuencia</option>
                <option v-for="f in FRECUENCIAS" :key="f" :value="f">{{ f }}</option>
              </select>
            </label>

            <label class="field">
              <span>Meta</span>
              <input v-model="form.meta" type="text" placeholder="Ej. 90%" required />
            </label>

            <label class="field">
              <span>Estado</span>
              <select v-model="form.activo">
                <option :value="true">Activo</option>
                <option :value="false">No Activo</option>
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
      <div v-if="indicadorABorrar" class="overlay" @click="indicadorABorrar = null">
        <div class="modal modal-sm" @click.stop>
          <div class="modal-head">
            <h2>Eliminar indicador</h2>
            <button class="modal-close" @click="indicadorABorrar = null">✕</button>
          </div>
          <div class="modal-body">
            <p>¿Seguro que quieres eliminar <strong>{{ indicadorABorrar.nombre }}</strong>? Esta acción no se puede deshacer.</p>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="indicadorABorrar = null">Cancelar</button>
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
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px; padding: 14px 16px; flex-wrap: wrap;
}
.toolbar-right { display: flex; align-items: center; gap: 12px; }
.search-wrap {
  display: flex; align-items: center; gap: 8px;
  background: var(--gray-100); border: 1px solid transparent;
  border-radius: 8px; padding: 7px 12px; color: var(--gray-500);
}
.search-wrap:focus-within { border-color: var(--brand-200); background: #fff; }
.search-wrap input { border: none; background: transparent; outline: none; font: inherit; font-size: 13px; }
.rows-select { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--gray-500); }
.rows-select select { padding: 5px 8px; border: 1px solid var(--border); border-radius: 6px; font: inherit; font-size: 13px; background: #fff; }

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

.pagination {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-top: 1px solid var(--border-soft); font-size: 13px;
}

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
</style>
