<template>
  <section class="auditorias-page">

    <div class="auditorias-page__top">
      <h1 class="auditorias-page__title">Auditorías Internas</h1>

      <span class="auditorias-page__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      </span>
    </div>

    <div class="auditorias-card">

      <div class="auditorias-card__actions">

        <button
          v-if="vistaActual === 'flujo'"
          class="auditorias-btn"
          @click="abrirReportes"
        >
          <span>▥</span>
          Reportes
        </button>

        <button
          v-else
          class="auditorias-btn"
          @click="volverAlFlujo"
        >
          <span>←</span>
          Volver al flujo
        </button>

      </div>

      <template v-if="vistaActual === 'flujo'">

        <h2 class="auditorias-flow__title">
          Flujo de la aplicación
        </h2>

        <div class="auditorias-flow">

          <div class="auditorias-flow__col">
            <button
              class="auditorias-step auditorias-step--arrow"
              :class="{ 'auditorias-step--active': etapaActiva === 1 }"
              @mouseenter="etapaActiva = 1"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(1)"
            >
              <svg class="auditorias-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6" />
                <path d="M9 16h4" />
              </svg>
              <span class="auditorias-step__text">
                Realizar<br>
                planeación
              </span>
            </button>

            <span class="auditorias-connector">
              <span class="auditorias-connector__line"></span>
              <span class="auditorias-connector__dot"></span>
            </span>

            <span class="auditorias-flow__role">Administrador</span>
          </div>

          <span class="auditorias-flow__arrow">→</span>

          <div class="auditorias-flow__col">
            <button
              class="auditorias-step auditorias-step--arrow"
              :class="{ 'auditorias-step--active': etapaActiva === 2 }"
              @mouseenter="etapaActiva = 2"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(2)"
            >
              <svg class="auditorias-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="10" cy="10" r="6" />
                <line x1="14.5" y1="14.5" x2="20" y2="20" />
              </svg>
              <span class="auditorias-step__text">
                Ejecutar<br>
                auditoría
              </span>
            </button>

            <span class="auditorias-connector">
              <span class="auditorias-connector__line"></span>
              <span class="auditorias-connector__dot"></span>
            </span>

            <span class="auditorias-flow__role">Administrador</span>
          </div>

          <span class="auditorias-flow__arrow">→</span>

          <div class="auditorias-flow__col">
            <button
              class="auditorias-step auditorias-step--arrow"
              :class="{ 'auditorias-step--active': etapaActiva === 3 }"
              @mouseenter="etapaActiva = 3"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(3)"
            >
              <svg class="auditorias-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 17 9 11 13 15 21 7" />
                <polyline points="14 7 21 7 21 14" />
              </svg>
              <span class="auditorias-step__text">
                Seguimiento de<br>
                hallazgos
              </span>
            </button>

            <span class="auditorias-connector">
              <span class="auditorias-connector__line"></span>
              <span class="auditorias-connector__dot"></span>
            </span>

            <span class="auditorias-flow__role">Responsable</span>
          </div>

          <span class="auditorias-flow__arrow">→</span>

          <div class="auditorias-flow__col">
            <button
              class="auditorias-step auditorias-step--decision"
              :class="{ 'auditorias-step--active': etapaActiva === 4 }"
              @mouseenter="etapaActiva = 4"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(4)"
            >
              <svg class="auditorias-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <span class="auditorias-step__text">
                Revisar<br>
                acciones
              </span>
            </button>

            <span class="auditorias-connector">
              <span class="auditorias-connector__line"></span>
              <span class="auditorias-connector__dot"></span>
            </span>

            <span class="auditorias-flow__role">Administrador</span>
          </div>

          <span class="auditorias-flow__arrow">→</span>

          <div class="auditorias-flow__col">
            <div class="auditorias-finish">
              <strong>Hallazgo cerrado</strong>
              <span>
                Cierre automático de
                hallazgos
              </span>
            </div>
          </div>

          <span class="auditorias-flow__arrow">→</span>

          <div class="auditorias-flow__col">
            <div class="auditorias-finish auditorias-finish--wide">
              <strong>Auditoría cerrada</strong>
              <span>
                Una vez completo el
                proceso, la auditoría se
                cerrará de forma automática
              </span>
            </div>
          </div>

        </div>

      </template>

      <template v-else>

        <h2 class="auditorias-flow__title">
          Selecciona una auditoría para ver su reporte
        </h2>

        <div class="auditorias-reportes-list">
          <button
            v-for="auditoria in auditoriasDemo"
            :key="auditoria.id"
            class="auditorias-reportes-item"
            @click="verReporte(auditoria)"
          >
            <div class="auditorias-reportes-item__main">
              <strong>{{ auditoria.titulo }}</strong>
              <span class="auditorias-reportes-item__area">{{ auditoria.area }}</span>
            </div>

            <div class="auditorias-reportes-item__meta">
              <span class="auditorias-badge" :class="claseEstado(auditoria.estado)">
                {{ auditoria.estado }}
              </span>
              <span class="auditorias-reportes-item__fecha">
                {{ auditoria.fechaPlaneacion || 'Sin fecha' }}
              </span>
              <span class="auditorias-reportes-item__arrow">›</span>
            </div>
          </button>
        </div>

      </template>

    </div>

    <div
      v-if="mostrarModalReporte && auditoriaSeleccionada"
      class="auditorias-modal-overlay"
      @click.self="cerrarModalReporte"
    >
      <div class="auditorias-modal">

        <div class="auditorias-modal__header">
          <h3 class="auditorias-modal__title">Reporte de auditoría</h3>
          <button
            class="auditorias-modal__close"
            aria-label="Cerrar"
            @click="cerrarModalReporte"
          >×</button>
        </div>

        <div class="auditorias-modal__body">

          <div class="auditorias-report-field">
            <span class="auditorias-report-field__label">Título de la auditoría</span>
            <span class="auditorias-report-field__value auditorias-report-field__value--big">
              {{ auditoriaSeleccionada.titulo }}
            </span>
          </div>

          <div class="auditorias-report-row">
            <div class="auditorias-report-field">
              <span class="auditorias-report-field__label">Área / proceso auditado</span>
              <span class="auditorias-report-field__value">{{ auditoriaSeleccionada.area || 'Sin registrar' }}</span>
            </div>

            <div class="auditorias-report-field">
              <span class="auditorias-report-field__label">Estado</span>
              <span class="auditorias-badge" :class="claseEstado(auditoriaSeleccionada.estado)">
                {{ auditoriaSeleccionada.estado }}
              </span>
            </div>
          </div>

          <div class="auditorias-report-row">
            <div class="auditorias-report-field">
              <span class="auditorias-report-field__label">Fecha de planeación</span>
              <span class="auditorias-report-field__value">{{ auditoriaSeleccionada.fechaPlaneacion || 'Sin registrar' }}</span>
            </div>

            <div class="auditorias-report-field">
              <span class="auditorias-report-field__label">Fecha de ejecución</span>
              <span class="auditorias-report-field__value">{{ auditoriaSeleccionada.fechaEjecucion || 'Aún no ejecutada' }}</span>
            </div>
          </div>

          <div class="auditorias-report-row">
            <div class="auditorias-report-field">
              <span class="auditorias-report-field__label">Responsable de planeación</span>
              <span class="auditorias-report-field__value">{{ auditoriaSeleccionada.responsablePlaneacion || 'Sin registrar' }}</span>
            </div>

            <div class="auditorias-report-field">
              <span class="auditorias-report-field__label">Responsable de ejecución</span>
              <span class="auditorias-report-field__value">{{ auditoriaSeleccionada.responsableEjecucion || 'Sin registrar' }}</span>
            </div>
          </div>

          <div class="auditorias-report-field">
            <span class="auditorias-report-field__label">Auditores involucrados</span>

            <ul
              v-if="auditoriaSeleccionada.auditores && auditoriaSeleccionada.auditores.length"
              class="auditorias-report-list"
            >
              <li v-for="persona in auditoriaSeleccionada.auditores" :key="persona">{{ persona }}</li>
            </ul>
            <span v-else class="auditorias-report-field__value auditorias-report-field__value--muted">
              Sin registrar
            </span>
          </div>

          <div class="auditorias-report-field">
            <span class="auditorias-report-field__label">Alcance y procesos que intervienen</span>
            <span class="auditorias-report-field__value">
              {{ auditoriaSeleccionada.alcance || 'Sin registrar' }}
            </span>
          </div>

          <div class="auditorias-report-field">
            <span class="auditorias-report-field__label">Hallazgos y acciones</span>

            <table
              v-if="auditoriaSeleccionada.hallazgos && auditoriaSeleccionada.hallazgos.length"
              class="auditorias-report-table"
            >
              <thead>
                <tr>
                  <th>Hallazgo</th>
                  <th>Acción</th>
                  <th>Responsable</th>
                  <th>Fecha<br>compromiso</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in auditoriaSeleccionada.hallazgos" :key="index">
                  <td>{{ item.hallazgo }}</td>
                  <td>{{ item.accion }}</td>
                  <td>{{ item.responsable }}</td>
                  <td>{{ item.fecha }}</td>
                  <td>
                    <span class="auditorias-badge" :class="claseEstado(item.estado)">
                      {{ item.estado }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <span v-else class="auditorias-report-field__value auditorias-report-field__value--muted">
              Aún no se han registrado hallazgos
            </span>
          </div>

          <div class="auditorias-report-field">
            <span class="auditorias-report-field__label">Comentarios generales</span>
            <span class="auditorias-report-field__value">
              {{ auditoriaSeleccionada.comentarios || 'Sin registrar' }}
            </span>
          </div>

          <div
            v-if="auditoriaSeleccionada.archivos && auditoriaSeleccionada.archivos.length"
            class="auditorias-report-field"
          >
            <span class="auditorias-report-field__label">Archivos adjuntos</span>

            <div class="auditorias-report-files">
              <span
                v-for="archivo in auditoriaSeleccionada.archivos"
                :key="archivo"
                class="auditorias-report-file"
              >
                📎 {{ archivo }}
              </span>
            </div>
          </div>

          <template v-if="auditoriaSeleccionada.estado === 'Cerrada'">
            <div class="auditorias-report-field auditorias-report-field--closure">
              <span class="auditorias-report-field__label">Información de cierre</span>

              <div class="auditorias-report-row">
                <div class="auditorias-report-field">
                  <span class="auditorias-report-field__label">Fecha de cierre</span>
                  <span class="auditorias-report-field__value">{{ auditoriaSeleccionada.fechaCierre || 'Sin registrar' }}</span>
                </div>

                <div class="auditorias-report-field">
                  <span class="auditorias-report-field__label">Duración total</span>
                  <span class="auditorias-report-field__value">{{ auditoriaSeleccionada.duracion || 'Sin registrar' }}</span>
                </div>
              </div>

              <span class="auditorias-report-field__label">Personas involucradas en el cierre</span>
              <ul
                v-if="auditoriaSeleccionada.cierre && auditoriaSeleccionada.cierre.personas && auditoriaSeleccionada.cierre.personas.length"
                class="auditorias-report-list"
              >
                <li v-for="persona in auditoriaSeleccionada.cierre.personas" :key="persona">{{ persona }}</li>
              </ul>
              <span v-else class="auditorias-report-field__value auditorias-report-field__value--muted">
                Sin registrar
              </span>
            </div>
          </template>

          <div class="auditorias-report-field">
            <span class="auditorias-report-field__label">Historial de seguimiento y modificaciones</span>

            <table
              v-if="auditoriaSeleccionada.historial && auditoriaSeleccionada.historial.length"
              class="auditorias-report-table"
            >
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in auditoriaSeleccionada.historial" :key="index">
                  <td>{{ item.fecha }}</td>
                  <td>{{ item.usuario }}</td>
                  <td>{{ item.comentario }}</td>
                </tr>
              </tbody>
            </table>
            <span v-else class="auditorias-report-field__value auditorias-report-field__value--muted">
              Sin movimientos registrados
            </span>
          </div>

        </div>

        <div class="auditorias-modal__footer">
          <button class="auditorias-btn-cerrar" @click="cerrarModalReporte">
            Cerrar
          </button>
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
      console.log("Realizar planeación");
      break;

    case 2:
      console.log("Ejecutar auditoría");
      break;

    case 3:
      console.log("Seguimiento de hallazgos");
      break;

    case 4:
      console.log("Revisar acciones");
      break;
  }
};

const claseEstado = (estado) => {
  switch (estado) {
    case "Cerrada":
    case "Cumplido":
      return "auditorias-badge--exito";

    case "En ejecución":
    case "En seguimiento":
      return "auditorias-badge--proceso";

    case "Pendiente":
      return "auditorias-badge--pendiente";

    case "Planeación":
    default:
      return "auditorias-badge--neutro";
  }
};

const mostrarModalReporte = ref(false);
const auditoriaSeleccionada = ref(null);

const verReporte = (auditoria) => {
  auditoriaSeleccionada.value = auditoria;
  mostrarModalReporte.value = true;
};

const cerrarModalReporte = () => {
  mostrarModalReporte.value = false;
  auditoriaSeleccionada.value = null;
};

const auditoriasDemo = ref([
  {
    id: 1,
    titulo: "Auditoría de Almacén de Registros",
    area: "Almacén de Registros",
    estado: "Cerrada",
    fechaPlaneacion: "2026-07-01",
    fechaEjecucion: "",
    fechaCierre: "",
    duracion: "",
    responsablePlaneacion: "",
    responsableEjecucion: "",
    auditores: [],
    alcance: "",
    hallazgos: [],
    comentarios: "",
    archivos: [],
    cierre: null,
    historial: [],
  },

  {
    id: 2,
    titulo: "Auditoría de Control de Documentos",
    area: "Control de Documentos",
    estado: "En seguimiento",
    fechaPlaneacion: "2026-08-01",
    fechaEjecucion: "",
    fechaCierre: "",
    duracion: "",
    responsablePlaneacion: "",
    responsableEjecucion: "",
    auditores: [],
    alcance: "",
    hallazgos: [],
    comentarios: "",
    archivos: [],
    cierre: null,
    historial: [],
  },

  {
    id: 3,
    titulo: "Auditoría de Gestión de Riesgos de Calidad",
    area: "Gestión de Riesgos de Calidad",
    estado: "Planeación",
    fechaPlaneacion: "2026-09-05",
    fechaEjecucion: "",
    fechaCierre: "",
    duracion: "",
    responsablePlaneacion: "",
    responsableEjecucion: "",
    auditores: [],
    alcance: "",
    hallazgos: [],
    comentarios: "",
    archivos: [],
    cierre: null,
    historial: [],
  },
]);
</script>

<style>
@import '@/assets/styles/Auditorias.css';
</style>
