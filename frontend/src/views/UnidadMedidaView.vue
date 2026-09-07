<template>
  <div class="unidadmedida-container">
    <div class="unidadmedida-card">
      <div class="unidadmedida-header">
        <h2>Catálogo de Unidades de Medida</h2>
      </div>

      <div class="unidadmedida-body">
        <div class="unidadmedida-toolbar">
          <button class="btn-nuevo" type="button" @click="abrirModal">
            <span aria-hidden="true">+</span> Nueva Unidad de Medida
          </button>
        </div>

        <div class="unidadmedida-filtros">
          <select v-model="filasPorPagina" class="select-filas">
            <option value="10">Mostrar 10 filas</option>
            <option value="25">Mostrar 25 filas</option>
            <option value="50">Mostrar 50 filas</option>
          </select>

          <button class="btn-exportar" type="button" @click="exportarCSV(unidadesFiltradas)">
            Exportar Excel
          </button>

          <div class="buscar">
            <label for="buscar-um">Buscar:</label>
            <input
              id="buscar-um"
              type="text"
              v-model="busqueda"
              @input="pagina = 1"
            />
          </div>
        </div>

        <div class="tabla-wrapper">
          <table class="tabla-unidadmedida">
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre / Concepto</th>
                <th>Descripción</th>
                <th>Tipo de Unidad</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="unidadesPaginadas.length === 0">
                <td colspan="6" class="sin-registros">
                  No se encontraron unidades de medida.
                </td>
              </tr>

              <tr v-for="unidad in unidadesPaginadas" :key="unidad.codigo">
                <td>{{ unidad.codigo }}</td>
                <td>{{ unidad.nombre }}</td>
                <td>{{ unidad.descripcion || '—' }}</td>
                <td>{{ unidad.tipo }}</td>

                <td>
                  <span :class="['estado', unidad.activo ? 'activo' : 'inactivo']">
                    {{ unidad.activo ? 'Activo' : 'No Activo' }}
                  </span>
                </td>

                <td>
                  <div class="acciones">
                    <button class="btn-editar" type="button" title="Editar" @click="abrirModalEdicion(unidad)">
                      <Pencil :size="15" />
                    </button>

                    <button class="btn-eliminar" type="button" title="Eliminar" @click="eliminarUnidad(unidad)">
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
        <h3>{{ editando ? 'Editar Unidad de Medida' : 'Nueva Unidad de Medida' }}</h3>
        <button class="modal-cerrar" type="button" @click="cerrarModal">×</button>
      </div>

      <form class="form-indicador" @submit.prevent="guardarUnidad">
        <div class="campo">
          <label for="codigo">Número / Código de la Unidad</label>
          <input
            id="codigo"
            v-model="formUnidad.codigo"
            type="text"
            placeholder="Ej. UM-001"
            required
          />
        </div>

        <div class="campo">
          <label for="nombre">Nombre o Concepto de la Unidad</label>
          <input
            id="nombre"
            v-model="formUnidad.nombre"
            type="text"
            placeholder="Ej. Porcentaje, Piezas, Horas..."
            required
          />
        </div>

        <div class="campo">
          <label for="descripcion">Descripción de la Unidad</label>
          <textarea
            id="descripcion"
            v-model="formUnidad.descripcion"
            placeholder="Describe brevemente qué representa esta unidad"
          ></textarea>
        </div>

        <div class="campo">
          <label for="tipo">Tipo de Unidad de Medida</label>
          <select id="tipo" v-model="formUnidad.tipo" required>
            <option value="" disabled>Selecciona un tipo</option>
            <option>Numérica</option>
            <option>Textual</option>
            <option>Porcentual</option>
            <option>Monetaria</option>
            <option>Temporal (tiempo)</option>
            <option>De cantidad / unidades</option>
            <option>Booleana (Sí / No)</option>
            <option>Otra</option>
          </select>
        </div>

        <div class="campo">
          <label for="estado">Estado</label>
          <select id="estado" v-model="formUnidad.activo">
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

const unidades = ref([]);

const formVacio = () => ({
  codigo: "",
  nombre: "",
  descripcion: "",
  tipo: "",
  activo: true,
});

const formUnidad = ref(formVacio());

const abrirModal = () => {
  editando.value = false;
  codigoEnEdicion.value = null;
  formUnidad.value = formVacio();
  mostrarModal.value = true;
};

const abrirModalEdicion = (unidad) => {
  editando.value = true;
  codigoEnEdicion.value = unidad.codigo;
  formUnidad.value = { ...unidad };
  mostrarModal.value = true;
};

const cerrarModal = () => {
  mostrarModal.value = false;
};

const guardarUnidad = () => {
  if (editando.value) {
    const index = unidades.value.findIndex((u) => u.codigo === codigoEnEdicion.value);
    if (index !== -1) {
      unidades.value[index] = { ...formUnidad.value };
    }
  } else {
    unidades.value.push({ ...formUnidad.value });
  }

  cerrarModal();
};

const eliminarUnidad = (unidad) => {
  const confirmado = window.confirm(
    `¿Eliminar la unidad de medida "${unidad.nombre}"? Esta acción no se puede deshacer.`
  );

  if (!confirmado) return;

  unidades.value = unidades.value.filter((u) => u.codigo !== unidad.codigo);
};

const unidadesFiltradas = computed(() => {
  const texto = busqueda.value.toLowerCase().trim();

  if (unidades.value.length === 0) return [];
  if (!texto) return unidades.value;

  return unidades.value.filter((unidad) => {
    return (
      unidad.codigo.toLowerCase().includes(texto) ||
      unidad.nombre.toLowerCase().includes(texto) ||
      (unidad.descripcion || "").toLowerCase().includes(texto) ||
      unidad.tipo.toLowerCase().includes(texto)
    );
  });
});

const totalPaginas = computed(() =>
  Math.max(1, Math.ceil(unidadesFiltradas.value.length / Number(filasPorPagina.value)))
);

const unidadesPaginadas = computed(() => {
  const inicio = (pagina.value - 1) * Number(filasPorPagina.value);
  return unidadesFiltradas.value.slice(inicio, inicio + Number(filasPorPagina.value));
});

watch(filasPorPagina, () => {
  pagina.value = 1;
});

watch(unidadesFiltradas, () => {
  if (pagina.value > totalPaginas.value) {
    pagina.value = totalPaginas.value;
  }
});

const exportarCSV = (datos) => {
  if (!datos.length) {
    window.alert("No hay datos para exportar.");
    return;
  }

  const encabezados = ["Código", "Nombre / Concepto", "Descripción", "Tipo de Unidad", "Estado"];

  const filas = datos.map((unidad) => [
    unidad.codigo,
    unidad.nombre,
    unidad.descripcion || "",
    unidad.tipo,
    unidad.activo ? "Activo" : "No Activo",
  ]);

  const escapar = (valor) => `"${String(valor).replace(/"/g, '""')}"`;

  const csv = [encabezados, ...filas]
    .map((fila) => fila.map(escapar).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "unidades_de_medida.csv";
  link.click();

  URL.revokeObjectURL(url);
};
</script>

<style>
@import '@/assets/styles/UnidadMedida.css';
</style>