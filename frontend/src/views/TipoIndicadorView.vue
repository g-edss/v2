<template>
  <div class="tipoindicador-container">
    <div class="tipoindicador-card">
      <div class="tipoindicador-header">
        <h2>Catálogo de Tipos de Indicador</h2>
      </div>

      <div class="tipoindicador-body">
        <div class="tipoindicador-toolbar">
          <button class="btn-nuevo" type="button" @click="abrirModal">
            <span aria-hidden="true">+</span> Nuevo Tipo de Indicador
          </button>
        </div>

        <div class="tipoindicador-filtros">
          <select v-model="filasPorPagina" class="select-filas">
            <option value="10">Mostrar 10 filas</option>
            <option value="25">Mostrar 25 filas</option>
            <option value="50">Mostrar 50 filas</option>
          </select>

          <button class="btn-exportar" type="button" @click="exportarCSV(tiposFiltrados)">
            Exportar Excel
          </button>

          <div class="buscar">
            <label for="buscar-tipo">Buscar:</label>
            <input
              id="buscar-tipo"
              type="text"
              v-model="busqueda"
              @input="pagina = 1"
            />
          </div>
        </div>

        <div class="tabla-wrapper">
          <table class="tabla-tipoindicador">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre del Tipo</th>
                <th>Descripción</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="tiposPaginados.length === 0">
                <td colspan="5" class="sin-registros">
                  No se encontraron tipos de indicador.
                </td>
              </tr>

              <tr v-for="tipo in tiposPaginados" :key="tipo.codigo">
                <td>{{ tipo.codigo }}</td>
                <td>{{ tipo.nombre }}</td>
                <td>{{ tipo.descripcion || '—' }}</td>

                <td>
                  <span :class="['estado', tipo.activo ? 'activo' : 'inactivo']">
                    {{ tipo.activo ? 'Activo' : 'No Activo' }}
                  </span>
                </td>

                <td>
                  <div class="acciones">
                    <button class="btn-editar" type="button" title="Editar" @click="abrirModalEdicion(tipo)">
                      <Pencil :size="15" />
                    </button>

                    <button class="btn-eliminar" type="button" title="Eliminar" @click="eliminarTipo(tipo)">
                      <Trash2 :size="15" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="paginacion">
          <span>Página {{ pagina }} de {{ totalPaginas }}</span>

          <div>
            <button type="button" :disabled="pagina === 1" @click="pagina--">Anterior</button>
            <button type="button" :disabled="pagina === totalPaginas" @click="pagina++">Siguiente</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-if="mostrarModal" class="modal-overlay" @click.self="cerrarModal">
    <div class="modal-indicador">
      <div class="modal-header">
        <h3>{{ editando ? 'Editar Tipo de Indicador' : 'Nuevo Tipo de Indicador' }}</h3>
        <button class="modal-cerrar" type="button" @click="cerrarModal">×</button>
      </div>

      <form class="form-indicador" @submit.prevent="guardarTipo">
        <div class="campo">
          <label for="codigo">Código</label>
          <input
            id="codigo"
            v-model="formTipo.codigo"
            type="text"
            placeholder="Ej. TI-001"
            required
          />
        </div>

        <div class="campo">
          <label for="nombre">Nombre del Tipo</label>
          <input
            id="nombre"
            v-model="formTipo.nombre"
            type="text"
            placeholder="Ej. Eficiencia, Eficacia, Cumplimiento..."
            required
          />
        </div>

        <div class="campo">
          <label for="descripcion">Descripción</label>
          <textarea
            id="descripcion"
            v-model="formTipo.descripcion"
            placeholder="Describe brevemente qué mide este tipo de indicador"
          ></textarea>
        </div>

        <div class="campo">
          <label for="estado">Estado</label>
          <select id="estado" v-model="formTipo.activo">
            <option :value="true">Activo</option>
            <option :value="false">No Activo</option>
          </select>
        </div>

        <div class="modal-botones">
          <button type="button" class="btn-cancelar" @click="cerrarModal">
            Cancelar
          </button>
          <button type="submit" class="btn-guardar">Guardar</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { Pencil, Trash2 } from "lucide-vue-next";

const busqueda = ref("");
const filasPorPagina = ref("10");
const pagina = ref(1);
const mostrarModal = ref(false);
const editando = ref(false);
const codigoEnEdicion = ref(null);

const tipos = ref([]);

const formVacio = () => ({
  codigo: "",
  nombre: "",
  descripcion: "",
  activo: true,
});

const formTipo = ref(formVacio());

const abrirModal = () => {
  editando.value = false;
  codigoEnEdicion.value = null;
  formTipo.value = formVacio();
  mostrarModal.value = true;
};

const abrirModalEdicion = (tipo) => {
  editando.value = true;
  codigoEnEdicion.value = tipo.codigo;
  formTipo.value = { ...tipo };
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
};

const guardarTipo = () => {
  if (editando.value) {
    const index = tipos.value.findIndex((t) => t.codigo === codigoEnEdicion.value);
    if (index !== -1) {
      tipos.value[index] = { ...formTipo.value };
    }
  } else {
    tipos.value.push({ ...formTipo.value });
  }

  cerrarModal();
};

const eliminarTipo = (tipo) => {
  const confirmado = window.confirm(
    `¿Eliminar el tipo de indicador "${tipo.nombre}"? Esta acción no se puede deshacer.`
  );

  if (!confirmado) return;

  tipos.value = tipos.value.filter((t) => t.codigo !== tipo.codigo);
};

const tiposFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase().trim();

  if (tipos.value.length === 0) return [];
  if (!texto) return tipos.value;

  return tipos.value.filter((tipo) => {
    return (
      tipo.codigo.toLowerCase().includes(texto) ||
      tipo.nombre.toLowerCase().includes(texto) ||
      (tipo.descripcion || "").toLowerCase().includes(texto)
    );
  });
});

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(tiposFiltrados.value.length / Number(filasPorPagina.value)))
);

const tiposPaginados = computed(() => {
  const inicio = (pagina.value - 1) * Number(filasPorPagina.value);
  return tiposFiltrados.value.slice(inicio, inicio + Number(filasPorPagina.value));
});

watch(filasPorPagina, () => {
  pagina.value = 1;
});

watch(tiposFiltrados, () => {
  if (pagina.value > totalPaginas.value) {
    pagina.value = totalPaginas.value;
  }
});

const exportarCSV = (datos) => {
  if (!datos.length) {
    window.alert("No hay datos para exportar.");
    return;
  }

  const encabezados = ["Código", "Nombre del Tipo", "Descripción", "Estado"];

  const filas = datos.map((tipo) => [
    tipo.codigo,
    tipo.nombre,
    tipo.descripcion || "",
    tipo.activo ? "Activo" : "No Activo",
  ]);

  const escapar = (valor) => `"${String(valor).replace(/"/g, '""')}"`;

  const csv = [encabezados, ...filas]
    .map((fila) => fila.map(escapar).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "tipos_de_indicador.csv";
  link.click();

  URL.revokeObjectURL(url);
};
</script>

<style>
@import '@/assets/styles/TipoIndicador.css';
</style>