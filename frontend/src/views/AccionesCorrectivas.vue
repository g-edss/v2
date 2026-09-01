<template>
  <section class="acciones-page">

    <div class="acciones-page__top">
      <h1 class="acciones-page__title">Acciones Correctivas</h1>
    </div>

    <div class="acciones-card">

      <div class="acciones-card__actions">

        <button class="acciones-btn" @click="abrirModalGeneral">
          <span>+</span>
          Acciones correctivas generales
        </button>

        <button class="acciones-btn" @click="abrirModalModificar">
          <span>✎</span>
          Modificar acciones
        </button>

        <button
          v-if="vistaActual === 'flujo'"
          class="acciones-btn"
          @click="abrirReportes"
        >
          <span>▥</span>
          Reportes
        </button>

        <button
          v-else
          class="acciones-btn"
          @click="volverAlFlujo"
        >
          <span>←</span>
          Volver al flujo
        </button>

      </div>

      <template v-if="vistaActual === 'flujo'">

        <h2 class="acciones-flow__title">
          Flujo de la aplicación
        </h2>

        <div class="acciones-flow">

          <div class="acciones-flow__col">
            <button
              class="acciones-step acciones-step--arrow"
              :class="{ 'acciones-step--active': etapaActiva === 1 }"
              @mouseenter="etapaActiva = 1"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(1)"
            >
              <span class="acciones-step__text">
                Levantar acción<br>
                correctiva
              </span>
            </button>

            <span class="acciones-connector">
              <span class="acciones-connector__line"></span>
              <span class="acciones-connector__dot"></span>
            </span>

            <span class="acciones-flow__role">Administrador</span>
          </div>

          <span class="acciones-flow__arrow">→</span>

          <div class="acciones-flow__col">
            <button
              class="acciones-step acciones-step--arrow acciones-step--current"
              :class="{ 'acciones-step--active': etapaActiva === 2 }"
              @mouseenter="etapaActiva = 2"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(2)"
            >
              <span class="acciones-step__text">
                Seguimiento a<br>
                acción correctiva
              </span>
            </button>

            <span class="acciones-connector">
              <span class="acciones-connector__line"></span>
              <span class="acciones-connector__dot"></span>
            </span>

            <span class="acciones-flow__role">Responsable</span>
          </div>

          <span class="acciones-flow__arrow">→</span>

          <div class="acciones-flow__col">
            <button
              class="acciones-step acciones-step--decision"
              :class="{ 'acciones-step--active': etapaActiva === 3 }"
              @mouseenter="etapaActiva = 3"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(3)"
            >
              <span class="acciones-step__text">
                Revisar<br>
                acciones
              </span>
            </button>

            <span class="acciones-connector">
              <span class="acciones-connector__line"></span>
              <span class="acciones-connector__dot"></span>
            </span>

            <span class="acciones-flow__role">Administrador</span>
          </div>

          <span class="acciones-flow__arrow">→</span>

          <div class="acciones-flow__col">
            <div class="acciones-finish">
              <strong>Acción cerrada</strong>
              <span>
                Una vez aceptada se
                cerrará la acción de
                manera automática
              </span>
            </div>
          </div>

        </div>

      </template>

      <template v-else>

        <h2 class="acciones-flow__title">
          Selecciona una acción correctiva para ver su reporte
        </h2>

        <div class="acciones-reportes-list">
          <button
            v-for="accion in accionesDemo"
            :key="accion.id"
            class="acciones-reportes-item"
            @click="verReporte(accion)"
          >
            <div class="acciones-reportes-item__main">
              <strong>{{ accion.titulo }}</strong>
              <span class="acciones-reportes-item__area">{{ accion.area || 'Sin área asignada' }}</span>
            </div>

            <div class="acciones-reportes-item__meta">
              <span class="acciones-badge" :class="claseEstado(accion.estado)">
                {{ accion.estado }}
              </span>
              <span class="acciones-reportes-item__fecha">
                {{ accion.fechaLevantamiento || 'Sin fecha' }}
              </span>
              <span class="acciones-reportes-item__arrow">›</span>
            </div>
          </button>
        </div>

      </template>

    </div>

    <div
      v-if="mostrarModalGeneral"
      class="acciones-modal-overlay"
      @click.self="cerrarModalGeneral"
    >
      <div class="acciones-modal">

        <div class="acciones-modal__header">
          <h3 class="acciones-modal__title">Nueva acción correctiva</h3>
          <button class="acciones-modal__close" aria-label="Cerrar" @click="cerrarModalGeneral">×</button>
        </div>

        <div class="acciones-modal__body">

          <div class="acciones-field">
            <label class="acciones-field__label">Título de la acción</label>
            <input
              v-model="formGeneral.titulo"
              type="text"
              class="acciones-input"
              placeholder="Ej. Corregir folio faltante en registros"
            >
          </div>

          <div class="acciones-modal__row">
            <div class="acciones-field">
              <label class="acciones-field__label">Área / proceso relacionado</label>
              <select v-model="formGeneral.area" class="acciones-select">
                <option value="" disabled>Selecciona un área</option>
                <option v-for="area in areasDisponibles" :key="area" :value="area">{{ area }}</option>
              </select>
            </div>

            <div class="acciones-field">
              <label class="acciones-field__label">Tipo</label>
              <select v-model="formGeneral.tipo" class="acciones-select">
                <option value="Correctiva">Correctiva</option>
                <option value="Preventiva">Preventiva</option>
              </select>
            </div>
          </div>

          <div class="acciones-modal__row">
            <div class="acciones-field">
              <label class="acciones-field__label">Prioridad</label>
              <select v-model="formGeneral.prioridad" class="acciones-select">
                <option value="Alta">Alta</option>
                <option value="Media">Media</option>
                <option value="Baja">Baja</option>
              </select>
            </div>

            <div class="acciones-field">
              <label class="acciones-field__label">Fecha compromiso</label>
              <input v-model="formGeneral.fechaCompromiso" type="date" class="acciones-input">
            </div>
          </div>

          <div class="acciones-modal__row">
            <div class="acciones-field">
              <label class="acciones-field__label">Responsable de levantamiento</label>
              <input v-model="formGeneral.responsableLevantamiento" type="text" class="acciones-input" placeholder="Nombre">
            </div>

            <div class="acciones-field">
              <label class="acciones-field__label">Responsable de seguimiento</label>
              <input v-model="formGeneral.responsableSeguimiento" type="text" class="acciones-input" placeholder="Nombre">
            </div>
          </div>

          <div class="acciones-field">
            <label class="acciones-field__label">Origen / hallazgo relacionado</label>
            <textarea
              v-model="formGeneral.origen"
              class="acciones-textarea"
              placeholder="¿De dónde surge esta acción? (auditoría, riesgo, queja, etc.)"
            ></textarea>
          </div>

          <div class="acciones-field">
            <label class="acciones-field__label">Descripción / plan de acción</label>
            <textarea
              v-model="formGeneral.descripcion"
              class="acciones-textarea"
              placeholder="Describe qué se va a hacer para corregir el problema"
            ></textarea>
          </div>

        </div>

        <div class="acciones-modal__footer">
          <button class="acciones-btn-cancel" @click="cerrarModalGeneral">Cancelar</button>
          <button
            class="acciones-btn-save"
            :disabled="!formGeneral.titulo || !formGeneral.area"
            @click="guardarAccionGeneral"
          >
            Guardar
          </button>
        </div>

      </div>
    </div>

    <div
      v-if="mostrarModalModificar"
      class="acciones-modal-overlay"
      @click.self="cerrarModalModificar"
    >
      <div class="acciones-modal">

        <div class="acciones-modal__header">
          <h3 class="acciones-modal__title">Modificar acción correctiva</h3>
          <button class="acciones-modal__close" aria-label="Cerrar" @click="cerrarModalModificar">×</button>
        </div>

        <div class="acciones-modal__body">

          <div class="acciones-field">
            <label class="acciones-field__label">Selecciona la acción a modificar</label>
            <select v-model="idAccionModificar" class="acciones-select" @change="cargarAccionParaModificar">
              <option value="" disabled>Selecciona una acción</option>
              <option v-for="accion in accionesDemo" :key="accion.id" :value="accion.id">
                {{ accion.titulo }}
              </option>
            </select>
          </div>

          <template v-if="formModificar">

            <div class="acciones-modal__row">
              <div class="acciones-field">
                <label class="acciones-field__label">Estado</label>
                <select v-model="formModificar.estado" class="acciones-select">
                  <option value="Levantada">Levantada</option>
                  <option value="En seguimiento">En seguimiento</option>
                  <option value="Cerrada">Cerrada</option>
                </select>
              </div>

              <div class="acciones-field">
                <label class="acciones-field__label">Fecha compromiso</label>
                <input v-model="formModificar.fechaCompromiso" type="date" class="acciones-input">
              </div>
            </div>

            <div class="acciones-field">
              <label class="acciones-field__label">Responsable de seguimiento</label>
              <input v-model="formModificar.responsableSeguimiento" type="text" class="acciones-input" placeholder="Nombre">
            </div>

            <div class="acciones-modal__row">
              <div class="acciones-field">
                <label class="acciones-field__label">Registrado por</label>
                <input v-model="formModificar.usuarioRegistra" type="text" class="acciones-input" placeholder="Tu nombre">
              </div>

              <div class="acciones-field">
                <span class="acciones-field__label">&nbsp;</span>
                <span class="acciones-field__hint">Este avance quedará en el historial de seguimiento</span>
              </div>
            </div>

            <div class="acciones-field">
              <label class="acciones-field__label">Comentario de avance</label>
              <textarea
                v-model="formModificar.comentario"
                class="acciones-textarea"
                placeholder="Describe el avance o cambio realizado"
              ></textarea>
            </div>

          </template>

        </div>

        <div class="acciones-modal__footer">
          <button class="acciones-btn-cancel" @click="cerrarModalModificar">Cancelar</button>
          <button
            class="acciones-btn-save"
            :disabled="!formModificar || !formModificar.comentario"
            @click="guardarModificacion"
          >
            Guardar cambios
          </button>
        </div>

      </div>
    </div>

    <div
      v-if="mostrarModalReporte && accionSeleccionada"
      class="acciones-modal-overlay"
      @click.self="cerrarModalReporte"
    >
      <div class="acciones-modal">

        <div class="acciones-modal__header">
          <h3 class="acciones-modal__title">Reporte de acción correctiva</h3>
          <button class="acciones-modal__close" aria-label="Cerrar" @click="cerrarModalReporte">×</button>
        </div>

        <div class="acciones-modal__body">

          <div class="acciones-report-field">
            <span class="acciones-report-field__label">Título de la acción</span>
            <span class="acciones-report-field__value acciones-report-field__value--big">
              {{ accionSeleccionada.titulo }}
            </span>
          </div>

          <div class="acciones-report-row">
            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Área / proceso</span>
              <span class="acciones-report-field__value">{{ accionSeleccionada.area || 'Sin registrar' }}</span>
            </div>

            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Estado</span>
              <span class="acciones-badge" :class="claseEstado(accionSeleccionada.estado)">
                {{ accionSeleccionada.estado }}
              </span>
            </div>
          </div>

          <div class="acciones-report-row">
            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Tipo</span>
              <span class="acciones-report-field__value">{{ accionSeleccionada.tipo || 'Sin registrar' }}</span>
            </div>

            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Prioridad</span>
              <span
                v-if="accionSeleccionada.prioridad"
                class="acciones-badge"
                :class="clasePrioridad(accionSeleccionada.prioridad)"
              >
                {{ accionSeleccionada.prioridad }}
              </span>
              <span v-else class="acciones-report-field__value acciones-report-field__value--muted">Sin registrar</span>
            </div>
          </div>

          <div class="acciones-report-field">
            <span class="acciones-report-field__label">Origen / hallazgo relacionado</span>
            <span class="acciones-report-field__value">
              {{ accionSeleccionada.origen || 'Sin registrar' }}
            </span>
          </div>

          <div class="acciones-report-row">
            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Responsable de levantamiento</span>
              <span class="acciones-report-field__value">{{ accionSeleccionada.responsableLevantamiento || 'Sin registrar' }}</span>
            </div>

            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Responsable de seguimiento</span>
              <span class="acciones-report-field__value">{{ accionSeleccionada.responsableSeguimiento || 'Sin registrar' }}</span>
            </div>
          </div>

          <div class="acciones-report-row">
            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Fecha de levantamiento</span>
              <span class="acciones-report-field__value">{{ accionSeleccionada.fechaLevantamiento || 'Sin registrar' }}</span>
            </div>

            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Fecha compromiso</span>
              <span class="acciones-report-field__value">{{ accionSeleccionada.fechaCompromiso || 'Sin registrar' }}</span>
            </div>
          </div>

          <div class="acciones-report-field">
            <span class="acciones-report-field__label">Descripción / plan de acción</span>
            <span class="acciones-report-field__value">
              {{ accionSeleccionada.descripcion || 'Sin registrar' }}
            </span>
          </div>

          <div class="acciones-report-field">
            <span class="acciones-report-field__label">Seguimientos</span>

            <table
              v-if="accionSeleccionada.seguimientos && accionSeleccionada.seguimientos.length"
              class="acciones-report-table"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Comentario</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in accionSeleccionada.seguimientos" :key="index">
                  <td>{{ item.fecha }}</td>
                  <td>{{ item.usuario }}</td>
                  <td>{{ item.comentario }}</td>
                  <td>
                    <span class="acciones-badge" :class="claseEstado(item.estado)">{{ item.estado }}</span>
                  </td>
                </tr>
              </tbody>
            </table>
            <span v-else class="acciones-report-field__value acciones-report-field__value--muted">
              Aún no se han registrado seguimientos
            </span>
          </div>

          <div class="acciones-report-field">
            <span class="acciones-report-field__label">Comentarios generales</span>
            <span class="acciones-report-field__value">
              {{ accionSeleccionada.comentarios || 'Sin registrar' }}
            </span>
          </div>

          <div
            v-if="accionSeleccionada.archivos && accionSeleccionada.archivos.length"
            class="acciones-report-field"
          >
            <span class="acciones-report-field__label">Archivos adjuntos</span>

            <div class="acciones-report-files">
              <span
                v-for="archivo in accionSeleccionada.archivos"
                :key="archivo"
                class="acciones-report-file"
              >
                📎 {{ archivo }}
              </span>
            </div>
          </div>

          <div
            v-if="accionSeleccionada.estado === 'Cerrada'"
            class="acciones-report-field acciones-report-field--closure"
          >
            <span class="acciones-report-field__label">Información de cierre</span>

            <div class="acciones-report-field">
              <span class="acciones-report-field__label">Fecha de cierre</span>
              <span class="acciones-report-field__value">{{ accionSeleccionada.fechaCierre || 'Sin registrar' }}</span>
            </div>
          </div>

        </div>

        <div class="acciones-modal__footer">
          <button class="acciones-btn-cerrar" @click="cerrarModalReporte">Cerrar</button>
        </div>

      </div>
    </div>

  </section>
</template>

<script setup>
import { ref } from "vue";

const vistaActual = ref("flujo");

const abrirReportes = () => {
  vistaActual.value = "reportes";
};

const volverAlFlujo = () => {
  vistaActual.value = "flujo";
};

const etapaActiva = ref(null);

const seleccionarEtapa = (etapa) => {
  console.log("Etapa seleccionada:", etapa);

  switch (etapa) {
    case 1:
      console.log("Levantar acción correctiva");
      break;

    case 2:
      console.log("Seguimiento a acción correctiva");
      break;

    case 3:
      console.log("Revisar acciones");
      break;
  }
};

const areasDisponibles = [
  "Almacén de Registros",
  "Control de Documentos",
  "Auditorías Internas",
  "Gestión de Riesgos de Calidad",
  "Gestión de Oportunidades",
  "Indicadores de Desempeño",
  "Proyecto de Mejora Continua",
  "Otro",
];

const claseEstado = (estado) => {
  switch (estado) {
    case "Cerrada":
      return "acciones-badge--exito";

    case "En seguimiento":
      return "acciones-badge--proceso";

    case "Levantada":
    default:
      return "acciones-badge--neutro";
  }
};

const clasePrioridad = (prioridad) => {
  switch (prioridad) {
    case "Alta":
      return "acciones-badge--alta";

    case "Media":
      return "acciones-badge--media";

    case "Baja":
    default:
      return "acciones-badge--baja";
  }
};

const accionesDemo = ref([
  {
    id: 1,
    titulo: "Corregir folio faltante en registros de almacén",
    area: "Almacén de Registros",
    estado: "Cerrada",
    tipo: "Correctiva",
    prioridad: "Alta",
    origen: "Hallazgo detectado en auditoría interna: registros sin folio de control.",
    responsableLevantamiento: "Ana Torres",
    responsableSeguimiento: "Laura Gómez",
    fechaLevantamiento: "2026-07-18",
    fechaCompromiso: "2026-08-01",
    fechaCierre: "2026-07-30",
    descripcion:
      "Implementar folio consecutivo digital para todos los registros nuevos y migrar el histórico existente.",
    seguimientos: [
      {
        fecha: "2026-07-22",
        usuario: "Laura Gómez",
        comentario: "Folio digital implementado en el 60% de los registros.",
        estado: "En seguimiento",
      },
      {
        fecha: "2026-07-30",
        usuario: "Laura Gómez",
        comentario: "Migración completada al 100%. Acción cerrada.",
        estado: "Cerrada",
      },
    ],
    comentarios: "Se recomienda auditar el folio digital en la próxima revisión trimestral.",
    archivos: ["evidencia_folio_digital.pdf"],
  },

  {
    id: 2,
    titulo: "Restringir acceso a versiones obsoletas",
    area: "Control de Documentos",
    estado: "En seguimiento",
    tipo: "Correctiva",
    prioridad: "Media",
    origen: "Hallazgo: versiones obsoletas visibles para usuarios finales.",
    responsableLevantamiento: "Fernanda Ruiz",
    responsableSeguimiento: "Roberto Salinas",
    fechaLevantamiento: "2026-08-08",
    fechaCompromiso: "2026-08-20",
    fechaCierre: "",
    descripcion:
      "Configurar permisos de visualización para ocultar versiones no vigentes del repositorio documental.",
    seguimientos: [
      {
        fecha: "2026-08-10",
        usuario: "Roberto Salinas",
        comentario: "Permisos configurados en ambiente de pruebas.",
        estado: "En seguimiento",
      },
    ],
    comentarios: "",
    archivos: [],
  },

  {
    id: 3,
    titulo: "Definir responsable de depuración documental",
    area: "Gestión de Riesgos de Calidad",
    estado: "Levantada",
    tipo: "Preventiva",
    prioridad: "Baja",
    origen: "",
    responsableLevantamiento: "",
    responsableSeguimiento: "",
    fechaLevantamiento: "2026-09-05",
    fechaCompromiso: "",
    fechaCierre: "",
    descripcion: "",
    seguimientos: [],
    comentarios: "",
    archivos: [],
  },
]);

const mostrarModalGeneral = ref(false);

const formGeneralVacio = () => ({
  titulo: "",
  area: "",
  tipo: "Correctiva",
  prioridad: "Media",
  fechaCompromiso: "",
  responsableLevantamiento: "",
  responsableSeguimiento: "",
  origen: "",
  descripcion: "",
});

const formGeneral = ref(formGeneralVacio());

const abrirModalGeneral = () => {
  formGeneral.value = formGeneralVacio();
  mostrarModalGeneral.value = true;
};

const cerrarModalGeneral = () => {
  mostrarModalGeneral.value = false;
};

const guardarAccionGeneral = () => {
  if (!formGeneral.value.titulo || !formGeneral.value.area) return;

  const nuevaAccion = {
    id: Date.now(),
    titulo: formGeneral.value.titulo,
    area: formGeneral.value.area,
    estado: "Levantada",
    tipo: formGeneral.value.tipo,
    prioridad: formGeneral.value.prioridad,
    origen: formGeneral.value.origen,
    responsableLevantamiento: formGeneral.value.responsableLevantamiento,
    responsableSeguimiento: formGeneral.value.responsableSeguimiento,
    fechaLevantamiento: new Date().toISOString().slice(0, 10),
    fechaCompromiso: formGeneral.value.fechaCompromiso,
    fechaCierre: "",
    descripcion: formGeneral.value.descripcion,
    seguimientos: [],
    comentarios: "",
    archivos: [],
  };

  accionesDemo.value.unshift(nuevaAccion);

  console.log("Acción correctiva creada:", nuevaAccion);

  cerrarModalGeneral();
};

const mostrarModalModificar = ref(false);
const idAccionModificar = ref("");
const formModificar = ref(null);

const abrirModalModificar = () => {
  idAccionModificar.value = "";
  formModificar.value = null;
  mostrarModalModificar.value = true;
};

const cerrarModalModificar = () => {
  mostrarModalModificar.value = false;
};

const cargarAccionParaModificar = () => {
  const accion = accionesDemo.value.find((item) => item.id === idAccionModificar.value);

  if (!accion) {
    formModificar.value = null;
    return;
  }

  formModificar.value = {
    estado: accion.estado,
    fechaCompromiso: accion.fechaCompromiso,
    responsableSeguimiento: accion.responsableSeguimiento,
    usuarioRegistra: "",
    comentario: "",
  };
};

const guardarModificacion = () => {
  if (!formModificar.value || !formModificar.value.comentario) return;

  const accion = accionesDemo.value.find((item) => item.id === idAccionModificar.value);
  if (!accion) return;

  accion.estado = formModificar.value.estado;
  accion.fechaCompromiso = formModificar.value.fechaCompromiso;
  accion.responsableSeguimiento = formModificar.value.responsableSeguimiento;

  if (accion.estado === "Cerrada" && !accion.fechaCierre) {
    accion.fechaCierre = new Date().toISOString().slice(0, 10);
  }

  accion.seguimientos.push({
    fecha: new Date().toISOString().slice(0, 10),
    usuario: formModificar.value.usuarioRegistra || "Sin especificar",
    comentario: formModificar.value.comentario,
    estado: accion.estado,
  });

  console.log("Acción correctiva modificada:", accion);

  cerrarModalModificar();
};

const mostrarModalReporte = ref(false);
const accionSeleccionada = ref(null);

const verReporte = (accion) => {
  accionSeleccionada.value = accion;
  mostrarModalReporte.value = true;
};

const cerrarModalReporte = () => {
  mostrarModalReporte.value = false;
  accionSeleccionada.value = null;
};
</script>

<style>
@import '@/assets/styles/AccionesC.css';
</style>
