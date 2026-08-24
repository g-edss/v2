<template>
  <section class="juntas-page">

    <div class="juntas-page__top">
      <h1 class="juntas-page__title">Juntas</h1>
    </div>

    <div class="juntas-card">

      <div class="juntas-card__actions">

        <button
          class="juntas-btn juntas-btn--primary"
          @click="juntaAhora"
        >
          <span>＋</span>
          Junta Ahora
        </button>

        <button
          class="juntas-btn"
          @click="modificarJunta"
        >
          <span>✎</span>
          Modificar Junta
        </button>

        <div class="juntas-reportes-wrap">

          <button
            class="juntas-btn"
            @click="alternarPanelReportes"
          >
            <span>▥</span>
            Reportes
          </button>

          <div
            v-if="mostrarPanelReportes"
            class="juntas-dropdown-catcher"
            @click="cerrarPanelReportes"
          ></div>

          <div v-if="mostrarPanelReportes" class="juntas-reportes-dropdown">

            <div class="juntas-reportes-dropdown__header">
              Juntas realizadas
            </div>

            <div v-if="reportesJuntas.length" class="juntas-reportes-dropdown__list">
              <button
                v-for="junta in reportesJuntas"
                :key="junta.id"
                class="juntas-reportes-dropdown__item"
                @click="abrirReporte(junta)"
              >
                <span class="juntas-reportes-dropdown__titulo">{{ junta.titulo }}</span>
                <span class="juntas-reportes-dropdown__meta">
                  {{ junta.fecha }} · {{ junta.estado }}
                </span>
              </button>
            </div>

            <div v-else class="juntas-reportes-dropdown__empty">
              Aún no hay juntas registradas.
            </div>

          </div>

        </div>

      </div>

      <h2 class="juntas-flow__title">
        Flujo de la aplicación
      </h2>

      <div class="juntas-flow">

        <div class="juntas-flow__col">
          <button
            class="juntas-step juntas-step--arrow"
            :class="{ 'juntas-step--active': etapaActiva === 1 }"
            @mouseenter="etapaActiva = 1"
            @mouseleave="etapaActiva = null"
            @click="seleccionarEtapa(1)"
          >
            <svg class="juntas-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
              <path d="M17 3.13a3 3 0 0 1 0 5.75" />
              <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
            </svg>
            <span class="juntas-step__text">
              Convocar junta
            </span>
          </button>

          <span class="juntas-connector">
            <span class="juntas-connector__line"></span>
            <span class="juntas-connector__dot"></span>
          </span>

          <span class="juntas-flow__role">Organizador</span>
        </div>

        <span class="juntas-flow__arrow">→</span>

        <div class="juntas-flow__col">
          <button
            class="juntas-step juntas-step--arrow"
            :class="{ 'juntas-step--active': etapaActiva === 2 }"
            @mouseenter="etapaActiva = 2"
            @mouseleave="etapaActiva = null"
            @click="seleccionarEtapa(2)"
          >
            <svg class="juntas-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              <rect x="9" y="3" width="6" height="4" rx="1" />
              <path d="M9 12h6" />
              <path d="M9 16h6" />
            </svg>
            <span class="juntas-step__text">
              Capturar<br>
              minutos
            </span>
          </button>

          <span class="juntas-connector">
            <span class="juntas-connector__line"></span>
            <span class="juntas-connector__dot"></span>
          </span>

          <span class="juntas-flow__role">Organizador</span>
        </div>

        <span class="juntas-flow__arrow">→</span>

        <div class="juntas-flow__col">
          <button
            class="juntas-step juntas-step--arrow"
            :class="{ 'juntas-step--active': etapaActiva === 3 }"
            @mouseenter="etapaActiva = 3"
            @mouseleave="etapaActiva = null"
            @click="seleccionarEtapa(3)"
          >
            <svg class="juntas-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 17 9 11 13 15 21 7" />
              <polyline points="14 7 21 7 21 14" />
            </svg>
            <span class="juntas-step__text">
              Capturar<br>
              avances
            </span>
          </button>

          <span class="juntas-connector">
            <span class="juntas-connector__line"></span>
            <span class="juntas-connector__dot"></span>
          </span>

          <span class="juntas-flow__role">Responsable</span>
        </div>

        <span class="juntas-flow__arrow">→</span>

        <div class="juntas-flow__col">
          <button
            class="juntas-step juntas-step--decision"
            :class="{ 'juntas-step--active': etapaActiva === 4 }"
            @mouseenter="etapaActiva = 4"
            @mouseleave="etapaActiva = null"
            @click="seleccionarEtapa(4)"
          >
            <svg class="juntas-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span class="juntas-step__text">
              Revisar<br>
              avances
            </span>
          </button>

          <span class="juntas-connector">
            <span class="juntas-connector__line"></span>
            <span class="juntas-connector__dot"></span>
          </span>

          <span class="juntas-flow__role">Organizador</span>
        </div>

        <span class="juntas-flow__arrow">→</span>

        <div class="juntas-flow__col">
          <div class="juntas-finish">
            <svg class="juntas-finish__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="9" />
              <polyline points="8 12 11 15 16 9" />
            </svg>

            <strong>Junta cerrada</strong>

            <span>
              Una vez revisada la
              junta, se cerrará de
              forma automática
            </span>
          </div>
        </div>

      </div>

    </div>

    <div
      v-if="mostrarModalAhora"
      class="juntas-modal-overlay"
      @click.self="cerrarModalAhora"
    >
      <div class="juntas-modal">

        <div class="juntas-modal__header">
          <h3 class="juntas-modal__title">Junta ahora</h3>
          <button
            class="juntas-modal__close"
            aria-label="Cerrar"
            @click="cerrarModalAhora"
          >×</button>
        </div>

        <div class="juntas-modal__body">

          <div class="juntas-field">
            <label class="juntas-field__label">Título de la junta</label>
            <input
              v-model="formAhora.titulo"
              type="text"
              class="juntas-input"
              placeholder="Ej. Revisión semanal de avances"
            >
          </div>

          <div class="juntas-modal__row">
            <div class="juntas-field">
              <label class="juntas-field__label">Tipo de junta</label>
              <select v-model="formAhora.tipo" class="juntas-select">
                <option disabled value="">Selecciona un tipo</option>
                <option>Ordinaria</option>
                <option>Extraordinaria</option>
                <option>Seguimiento</option>
              </select>
            </div>

            <div class="juntas-field">
              <label class="juntas-field__label">Modalidad</label>
              <select v-model="formAhora.modalidad" class="juntas-select">
                <option disabled value="">Selecciona una modalidad</option>
                <option>Presencial</option>
                <option>Virtual</option>
                <option>Híbrida</option>
              </select>
            </div>
          </div>

          <div class="juntas-modal__row">
            <div class="juntas-field">
              <label class="juntas-field__label">Fecha</label>
              <input
                v-model="formAhora.fecha"
                type="date"
                class="juntas-input"
              >
            </div>

            <div class="juntas-field">
              <label class="juntas-field__label">Hora de inicio</label>
              <input
                v-model="formAhora.hora"
                type="time"
                class="juntas-input"
              >
            </div>
          </div>

          <div class="juntas-field">
            <label class="juntas-field__label">Organizador</label>
            <input
              v-model="formAhora.organizador"
              type="text"
              class="juntas-input"
              placeholder="Nombre del organizador"
            >
          </div>

          <div class="juntas-field">
            <label class="juntas-field__label">Participantes</label>
            <input
              v-model="formAhora.participantes"
              type="text"
              class="juntas-input"
              placeholder="Ej. Juan Pérez, María López"
            >
          </div>

          <div class="juntas-field">
            <label class="juntas-field__label">Agenda / temas a tratar</label>
            <textarea
              v-model="formAhora.agenda"
              class="juntas-textarea"
              rows="3"
              placeholder="Ej. Avance de proyectos, pendientes de la semana anterior..."
            ></textarea>
          </div>

        </div>

        <div class="juntas-modal__footer">
          <button class="juntas-btn-cancel" @click="cerrarModalAhora">
            Cancelar
          </button>
          <button class="juntas-btn-save" @click="iniciarJuntaAhora">
            Iniciar junta
          </button>
        </div>

      </div>
    </div>

    <div
      v-if="mostrarModalModificar"
      class="juntas-modal-overlay"
      @click.self="cerrarModalModificar"
    >
      <div class="juntas-modal">

        <div class="juntas-modal__header">
          <h3 class="juntas-modal__title">Modificar junta</h3>
          <button
            class="juntas-modal__close"
            aria-label="Cerrar"
            @click="cerrarModalModificar"
          >×</button>
        </div>

        <div class="juntas-modal__body">

          <div class="juntas-field">
            <label class="juntas-field__label">Título de la junta</label>
            <input
              v-model="formModificar.titulo"
              type="text"
              class="juntas-input"
              placeholder="Ej. Revisión semanal de avances"
            >
          </div>

          <div class="juntas-modal__row">
            <div class="juntas-field">
              <label class="juntas-field__label">Fecha</label>
              <input
                v-model="formModificar.fecha"
                type="date"
                class="juntas-input"
              >
            </div>

            <div class="juntas-field">
              <label class="juntas-field__label">Hora</label>
              <input
                v-model="formModificar.hora"
                type="time"
                class="juntas-input"
              >
            </div>
          </div>

          <div class="juntas-modal__row">
            <div class="juntas-field">
              <label class="juntas-field__label">Organizador</label>
              <input
                v-model="formModificar.organizador"
                type="text"
                class="juntas-input"
                placeholder="Nombre del organizador"
              >
            </div>

            <div class="juntas-field">
              <label class="juntas-field__label">Responsable</label>
              <input
                v-model="formModificar.responsable"
                type="text"
                class="juntas-input"
                placeholder="Nombre del responsable"
              >
            </div>
          </div>

          <div class="juntas-field">
            <label class="juntas-field__label">Estado de la junta</label>
            <select v-model="formModificar.estado" class="juntas-select">
              <option disabled value="">Selecciona un estado</option>
              <option>Programada</option>
              <option>En curso</option>
              <option>Cerrada</option>
            </select>
          </div>

          <div class="juntas-field">
            <label class="juntas-field__label">Participantes</label>
            <input
              v-model="formModificar.participantes"
              type="text"
              class="juntas-input"
              placeholder="Ej. Juan Pérez, María López"
            >
          </div>

          <div class="juntas-field">
            <label class="juntas-field__label">Notas</label>
            <textarea
              v-model="formModificar.notas"
              class="juntas-textarea"
              rows="3"
              placeholder="Ej. Cambios de última hora, motivo de la modificación..."
            ></textarea>
          </div>

        </div>

        <div class="juntas-modal__footer">
          <button class="juntas-btn-cancel" @click="cerrarModalModificar">
            Cancelar
          </button>
          <button
            class="juntas-btn-save"
            @click="guardarModificarJunta"
          >
            Guardar cambios
          </button>
        </div>

      </div>
    </div>

    <div
      v-if="mostrarModalReporte"
      class="juntas-modal-overlay"
      @click.self="cerrarModalReporte"
    >
      <div class="juntas-modal juntas-modal--report">

        <div class="juntas-modal__header">
          <h3 class="juntas-modal__title">
            Reporte de junta
          </h3>
          <button
            class="juntas-modal__close"
            aria-label="Cerrar"
            @click="cerrarModalReporte"
          >×</button>
        </div>

        <div v-if="reporteSeleccionado" class="juntas-modal__body">

          <div class="juntas-report__section">
            <span class="juntas-report__label">Título de la junta</span>
            <span class="juntas-report__value juntas-report__value--strong">
              {{ reporteSeleccionado.titulo }}
            </span>
          </div>

          <div class="juntas-report__grid">
            <div class="juntas-report__section">
              <span class="juntas-report__label">Fecha</span>
              <span class="juntas-report__value">{{ reporteSeleccionado.fecha }}</span>
            </div>

            <div class="juntas-report__section">
              <span class="juntas-report__label">Estado</span>
              <span class="juntas-report__badge">{{ reporteSeleccionado.estado }}</span>
            </div>
          </div>

          <div class="juntas-report__grid">
            <div class="juntas-report__section">
              <span class="juntas-report__label">Organizador</span>
              <span class="juntas-report__value" :class="{ 'juntas-report__value--empty': !reporteSeleccionado.organizador }">
                {{ reporteSeleccionado.organizador || "Sin registrar" }}
              </span>
            </div>

            <div class="juntas-report__section">
              <span class="juntas-report__label">Responsable</span>
              <span class="juntas-report__value" :class="{ 'juntas-report__value--empty': !reporteSeleccionado.responsable }">
                {{ reporteSeleccionado.responsable || "Sin registrar" }}
              </span>
            </div>
          </div>

          <div class="juntas-report__section">
            <span class="juntas-report__label">Asistentes</span>

            <ul v-if="reporteSeleccionado.asistentes.length" class="juntas-report__list">
              <li v-for="asistente in reporteSeleccionado.asistentes" :key="asistente">
                {{ asistente }}
              </li>
            </ul>
            <span v-else class="juntas-report__value juntas-report__value--empty">
              Aún no hay asistentes registrados.
            </span>
          </div>

          <div class="juntas-report__section">
            <span class="juntas-report__label">Temas tratados</span>
            <span class="juntas-report__value" :class="{ 'juntas-report__value--empty': !reporteSeleccionado.temas }">
              {{ reporteSeleccionado.temas || "Sin registrar" }}
            </span>
          </div>

          <div class="juntas-report__section">
            <span class="juntas-report__label">Acuerdos y compromisos</span>

            <table v-if="reporteSeleccionado.acuerdos.length" class="juntas-report__table">
              <thead>
                <tr>
                  <th>Acuerdo</th>
                  <th>Responsable</th>
                  <th>Fecha compromiso</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(acuerdo, i) in reporteSeleccionado.acuerdos" :key="i">
                  <td>{{ acuerdo.descripcion }}</td>
                  <td>{{ acuerdo.responsable }}</td>
                  <td>{{ acuerdo.fechaCompromiso }}</td>
                  <td>{{ acuerdo.estado }}</td>
                </tr>
              </tbody>
            </table>
            <span v-else class="juntas-report__value juntas-report__value--empty">
              Aún no hay acuerdos registrados.
            </span>
          </div>

          <div class="juntas-report__section">
            <span class="juntas-report__label">Comentarios generales</span>
            <span class="juntas-report__value" :class="{ 'juntas-report__value--empty': !reporteSeleccionado.comentarios }">
              {{ reporteSeleccionado.comentarios || "Sin registrar" }}
            </span>
          </div>

          <div class="juntas-report__section">
            <span class="juntas-report__label">Archivos adjuntos</span>

            <div v-if="reporteSeleccionado.archivos.length" class="juntas-report__files">
              <span
                v-for="archivo in reporteSeleccionado.archivos"
                :key="archivo"
                class="juntas-report__file-pill"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
                {{ archivo }}
              </span>
            </div>
            <span v-else class="juntas-report__value juntas-report__value--empty">
              No hay archivos adjuntos.
            </span>
          </div>

          <div class="juntas-report__section">
            <span class="juntas-report__label">Historial de seguimientos</span>

            <table v-if="reporteSeleccionado.seguimientos.length" class="juntas-report__table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(seg, i) in reporteSeleccionado.seguimientos" :key="i">
                  <td>{{ seg.fecha }}</td>
                  <td>{{ seg.usuario }}</td>
                  <td>{{ seg.comentario }}</td>
                </tr>
              </tbody>
            </table>
            <span v-else class="juntas-report__value juntas-report__value--empty">
              Aún no hay seguimientos registrados.
            </span>
          </div>

        </div>

        <div class="juntas-modal__footer">
          <button class="juntas-btn-cancel" @click="cerrarModalReporte">
            Cerrar
          </button>
        </div>

      </div>
    </div>

  </section>
</template>

<script setup>
import { ref } from "vue";

const etapaActiva = ref(null);

const seleccionarEtapa = (etapa) => {
  console.log("Etapa seleccionada:", etapa);

  switch (etapa) {
    case 1:
      console.log("Convocar junta");
      break;

    case 2:
      console.log("Capturar minutos");
      break;

    case 3:
      console.log("Capturar avances");
      break;

    case 4:
      console.log("Revisar avances");
      break;
  }
};

const juntaAhora = () => {
  abrirModalAhora();
};

const modificarJunta = () => {
  abrirModalModificar();
};

const mostrarPanelReportes = ref(false);

const reportesJuntas = ref([
  {
    id: 1,
    titulo: "Revisión de avances Q3",
    fecha: "2026-08-10",
    estado: "Cerrada",
    organizador: "",
    responsable: "",
    asistentes: [],
    temas: "",
    acuerdos: [],
    comentarios: "",
    archivos: [],
    seguimientos: [],
  },
  {
    id: 2,
    titulo: "Seguimiento de auditoría interna",
    fecha: "2026-07-28",
    estado: "Cerrada",
    organizador: "",
    responsable: "",
    asistentes: [],
    temas: "",
    acuerdos: [],
    comentarios: "",
    archivos: [],
    seguimientos: [],
  },
]);

const alternarPanelReportes = () => {
  mostrarPanelReportes.value = !mostrarPanelReportes.value;
};

const cerrarPanelReportes = () => {
  mostrarPanelReportes.value = false;
};

const mostrarModalReporte = ref(false);

const reporteSeleccionado = ref(null);

const abrirReporte = (junta) => {
  reporteSeleccionado.value = junta;
  mostrarPanelReportes.value = false;
  mostrarModalReporte.value = true;
};

const cerrarModalReporte = () => {
  mostrarModalReporte.value = false;
  reporteSeleccionado.value = null;
};

const mostrarModalAhora = ref(false);

const formAhora = ref({
  titulo: "",
  tipo: "",
  modalidad: "",
  fecha: "",
  hora: "",
  organizador: "",
  participantes: "",
  agenda: "",
});

const abrirModalAhora = () => {
  formAhora.value = {
    titulo: "",
    tipo: "",
    modalidad: "",
    fecha: "",
    hora: "",
    organizador: "",
    participantes: "",
    agenda: "",
  };

  mostrarModalAhora.value = true;
};

const cerrarModalAhora = () => {
  mostrarModalAhora.value = false;
};

const iniciarJuntaAhora = () => {
  console.log("Iniciar junta ahora:", formAhora.value);
  cerrarModalAhora();
};

const mostrarModalModificar = ref(false);

const formModificar = ref({
  titulo: "",
  fecha: "",
  hora: "",
  organizador: "",
  responsable: "",
  estado: "",
  participantes: "",
  notas: "",
});

const abrirModalModificar = () => {
  formModificar.value = {
    titulo: "",
    fecha: "",
    hora: "",
    organizador: "",
    responsable: "",
    estado: "",
    participantes: "",
    notas: "",
  };

  mostrarModalModificar.value = true;
};

const cerrarModalModificar = () => {
  mostrarModalModificar.value = false;
};

const guardarModificarJunta = () => {
  console.log("Guardar cambios de la junta:", formModificar.value);
  cerrarModalModificar();
};
</script>

<style>
@import '@/assets/styles/Juntas.css';
</style>
