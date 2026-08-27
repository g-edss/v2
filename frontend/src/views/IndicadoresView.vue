<script setup>
import { ref, computed, onMounted } from 'vue';
import { api } from '@/api/client.js';
//import { Pencil, Trash2 } from 'lucide-vue-next';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';

/* ---------- Datos ---------- */
const indicadores   = ref([]);
const procesos = ref([]);
const unidadesMedida = ref([]);
const cargando = ref(false);
const error = ref('');
const busqueda      = ref('');
const filasPorPagina = ref(10);
const pagina        = ref(1);

const FRECUENCIAS = [
  { valor: 'mensual', etiqueta: 'Mensual' },
  { valor: 'trimestral', etiqueta: 'Trimestral' },
  { valor: 'semestral', etiqueta: 'Semestral' },
  { valor: 'anual', etiqueta: 'Anual' },
];

const SENTIDOS = [
  { valor: 'mayor_mejor', etiqueta: 'Mayor es mejor' },
  { valor: 'menor_mejor', etiqueta: 'Menor es mejor' },
  { valor: 'rango', etiqueta: 'Debe permanecer en el rango' },
];

async function cargarDatos() {
  cargando.value = true;
  error.value = '';

  try {
    const [
      indicadoresRespuesta,
      procesosRespuesta,
      unidadesRespuesta,
    ] = await Promise.all([
      api.get('/indicadores'),
      api.get('/procesos'),
      api.get('/unidades-medida'),
    ]);

    indicadores.value = indicadoresRespuesta;
    procesos.value = procesosRespuesta;
    unidadesMedida.value = unidadesRespuesta;
  } catch {
    error.value = 'No se pudo cargar el catálogo de indicadores.';
  } finally {
    cargando.value = false;
  }
}

onMounted(cargarDatos);

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
const modalAbierto = ref(false);
const esNuevo = ref(true);
const guardando = ref(false);
const errorFormulario = ref('');
const indicadorADesactivar = ref(null);

const formularioVacio = () => ({
  id: null,
  codigo: '',
  nombre: '',
  descripcion: '',
  proceso_id: '',
  unidad_medida_id: '',
  frecuencia: '',
  meta_minima: '',
  meta_maxima: '',
  sentido: 'rango',
  activo: true,
});

const form = ref(formularioVacio());

function abrirNuevo() {
  esNuevo.value = true;
  form.value = formularioVacio();
  errorFormulario.value = '';
  modalAbierto.value = true;
}

function editar(indicador) {
  esNuevo.value = false;
  form.value = {
    id: indicador.id,
    codigo: indicador.codigo,
    nombre: indicador.nombre,
    descripcion: indicador.descripcion,
    proceso_id: indicador.proceso_id,
    unidad_medida_id: indicador.unidad_medida_id,
    frecuencia: indicador.frecuencia,
    meta_minima: indicador.meta_minima,
    meta_maxima: indicador.meta_maxima,
    sentido: indicador.sentido,
    activo: indicador.activo,
  };
  errorFormulario.value = '';
  modalAbierto.value = true;
}

function cerrarModal() {
  modalAbierto.value = false;
  errorFormulario.value = '';
}

async function guardar() {

  if (
    !form.value.codigo.trim() ||
    !form.value.nombre.trim() ||
    !form.value.descripcion.trim() ||
    !form.value.proceso_id ||
    !form.value.unidad_medida_id ||
    !form.value.frecuencia ||
    form.value.meta_minima === '' ||
    form.value.meta_maxima === ''
  ) {
    errorFormulario.value =
      'Completa todos los campos obligatorios.';
    return;
  }

  guardando.value = true;
  errorFormulario.value = '';

  try {
  const datos = {
    codigo: form.value.codigo.trim(),
    nombre: form.value.nombre.trim(),
    descripcion: form.value.descripcion.trim(),
    proceso_id: Number(form.value.proceso_id),
    unidad_medida_id: Number(form.value.unidad_medida_id),
    frecuencia: form.value.frecuencia,
    meta_minima: Number(form.value.meta_minima),
    meta_maxima: Number(form.value.meta_maxima),
    sentido: form.value.sentido,
    activo: form.value.activo,
  };

  if (esNuevo.value) {
    await api.post('/indicadores', datos);
  } else {
    await api.put(`/indicadores/${form.value.id}`, datos);
  }

  await cargarDatos();
  cerrarModal();
} catch {
  errorFormulario.value =
    'No se pudo guardar. Revisa los datos o el código utilizado.';
} finally {
  guardando.value = false;
}
}

async function confirmarDesactivacion() {
  if (!indicadorADesactivar.value) return;

  try {
    await api.del(
      `/indicadores/${indicadorADesactivar.value.id}`
    );

    await cargarDatos();
  } catch {
    error.value = 'No se pudo desactivar el indicador.';
  } finally {
    indicadorADesactivar.value = null;
  }
}

function formatearFrecuencia(valor) {
  const frecuencia = FRECUENCIAS.find(
    (opcion) => opcion.valor === valor
  );

  return frecuencia?.etiqueta || valor;
}

function formatearNumero(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return '—';
  }

  return new Intl.NumberFormat('es-MX', {
    maximumFractionDigits: 4,
  }).format(Number(valor));
}

function formatearMeta(indicador) {
  const minimo = formatearNumero(indicador.meta_minima);
  const maximo = formatearNumero(indicador.meta_maxima);
  const simbolo = indicador.unidad_simbolo
    ? ` ${indicador.unidad_simbolo}`
    : '';

  return `${minimo} - ${maximo}${simbolo}`;
}

/* ---------- Exportar CSV ---------- */
function exportarCSV() {
  const enc  = ['Código', 'Nombre', 'Proceso', 'Responsable', 'Frecuencia', 'Meta mínima', 'Meta máxima', 'Unidad', 'Estado'];
  const filas = indicadoresFiltrados.value.map((indicador) => [
    indicador.codigo,
    indicador.nombre,
    indicador.proceso,
    indicador.responsable,
    formatearFrecuencia(indicador.frecuencia),
    indicador.meta_minima,
    indicador.meta_maxima,
    indicador.unidad_medida,
    indicador.activo ? 'Activo' : 'Inactivo',
  ]);
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
      <p v-if="cargando" class="estado-mensaje">
        Cargando indicadores...
      </p>

      <p v-else-if="error" class="estado-mensaje estado-error">
        {{ error }}
      </p>
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
            <td class="muted">{{ formatearFrecuencia(ind.frecuencia) }}</td>
            <td>{{ formatearMeta(ind) }}</td>
            <td>
              <span class="badge" :class="ind.activo ? 'badge-ok' : 'badge-muted'">
                {{ ind.activo ? 'Activo' : 'No Activo' }}
              </span>
            </td>
            <td>
              <div class="row-actions">
                <button class="action-btn edit" title="Editar" @click="editar(ind)">
                  <span aria-hidden="true">✎</span>
                </button>
                <button
                  class="action-btn del"
                  :title="ind.activo ? 'Desactivar indicador' : 'Indicador inactivo'"
                  :disabled="!ind.activo"
                  @click="indicadorADesactivar = ind"
                >
                  <span aria-hidden="true">×</span>
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
              <span>Código *</span>
              <input
                v-model="form.codigo"
                type="text"
                placeholder="Ej. IND-001"
              />
            </label>

            <label class="field">
              <span>Nombre del indicador *</span>
              <input
                v-model="form.nombre"
                type="text"
                placeholder="Ej. Cumplimiento de objetivos"
              />
            </label>

            <label class="field">
              <span>Descripción: ¿qué mide el indicador? *</span>
              <textarea
                v-model="form.descripcion"
                rows="3"
                placeholder="Describe claramente qué se medirá"
              ></textarea>
            </label>

            <label class="field">
              <span>Proceso *</span>
              <select v-model="form.proceso_id">
                <option value="" disabled>Selecciona un proceso</option>

                <option
                  v-for="proceso in procesos"
                  :key="proceso.id"
                  :value="proceso.id"
                >
                  {{ proceso.nombre }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Unidad de medida *</span>
              <select v-model="form.unidad_medida_id">
                <option value="" disabled>Selecciona una unidad</option>

                <option
                  v-for="unidad in unidadesMedida"
                  :key="unidad.id"
                  :value="unidad.id"
                >
                  {{ unidad.nombre }}
                  {{ unidad.simbolo ? `(${unidad.simbolo})` : '' }}
                </option>
              </select>
            </label>

            <label class="field">
              <span>Frecuencia de medición *</span>
              <select v-model="form.frecuencia">
                <option value="" disabled>Selecciona una frecuencia</option>

                <option
                  v-for="frecuencia in FRECUENCIAS"
                  :key="frecuencia.valor"
                  :value="frecuencia.valor"
                >
                  {{ frecuencia.etiqueta }}
                </option>
              </select>
            </label>

            <div class="form-grid">
              <label class="field">
                <span>Meta mínima *</span>
                <input
                  v-model="form.meta_minima"
                  type="number"
                  step="0.01"
                  placeholder="Ej. 80"
                />
              </label>

              <label class="field">
                <span>Meta máxima *</span>
                <input
                  v-model="form.meta_maxima"
                  type="number"
                  step="0.01"
                  placeholder="Ej. 100"
                />
              </label>
            </div>

            <label class="field">
              <span>Interpretación del resultado *</span>
              <select v-model="form.sentido">
                <option
                  v-for="sentido in SENTIDOS"
                  :key="sentido.valor"
                  :value="sentido.valor"
                >
                  {{ sentido.etiqueta }}
                </option>
              </select>
            </label>

            <label v-if="!esNuevo" class="field">
              <span>Estado</span>

              <select v-model="form.activo">
                <option :value="true">Activo</option>
                <option :value="false">Inactivo</option>
              </select>
            </label>

            <p v-if="errorFormulario" class="form-error">
              {{ errorFormulario }}
            </p>

            <div class="modal-actions">
              <button class="btn btn-ghost" :disabled="guardando" @click="cerrarModal">Cancelar</button>
              <button class="btn btn-primary" :disabled="guardando" @click="guardar">{{ guardando ? 'Guardando...' : 'Guardar' }}</button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- ===== MODAL ELIMINAR ===== -->
    <Teleport to="body">
      <div v-if="indicadorADesactivar" class="overlay" @click="indicadorADesactivar = null">
        <div class="modal modal-sm" @click.stop>
          <div class="modal-head">
            <h2>Desactivar indicador</h2>
            <button class="modal-close" @click="indicadorADesactivar = null">✕</button>
          </div>
          <div class="modal-body">
              <p>
                ¿Seguro que quieres desactivar
                <strong>{{ indicadorADesactivar.nombre }}</strong>?
                El indicador seguirá guardado y podrás reactivarlo al editarlo.
              </p>
            <div class="modal-actions">
              <button class="btn btn-ghost" @click="indicadorADesactivar = null">Cancelar</button>
              <button class="btn" style="background:var(--danger);color:#fff" @click="confirmarDesactivacion">Desactivar</button>
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

.estado-mensaje {
  margin: 16px;
  padding: 12px;
  border-radius: 8px;
  background: var(--gray-100);
  color: var(--gray-700);
  font-size: 14px;
}

.estado-error {
  background: var(--danger-bg);
  color: var(--danger);
}

.field textarea {
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 7px;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  outline: none;
  resize: vertical;
}

.field textarea:focus {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-100);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.form-error {
  padding: 10px;
  border-radius: 7px;
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 13px;
}

.modal {
  max-width: 560px;
}

@media (max-width: 520px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}
</style>
