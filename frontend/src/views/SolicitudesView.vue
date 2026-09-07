<template>
  <section class="solcambio-page">

    <div class="solcambio-page__top">
      <h1 class="solcambio-page__title">Solicitud de Cambios</h1>

      <span class="solcambio-page__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M20 3.5l0.5 0.5-8 8-3 1 1-3 8-8z" />
        </svg>
      </span>
    </div>

    <div class="solcambio-card">

      <div class="solcambio-card__actions">

        <template v-if="vistaActual === 'flujo'">
          <button class="solcambio-btn solcambio-btn--solido" @click="abrirNuevaSolicitud">
            <span>+</span>
            Nueva solicitud
          </button>

          <button class="solcambio-btn" @click="abrirSolicitudes">
            <span>▥</span>
            Solicitudes
          </button>
        </template>

        <button v-else class="solcambio-btn" @click="volverAlFlujo">
          <span>←</span>
          Volver al flujo
        </button>

      </div>

      <template v-if="vistaActual === 'flujo'">

        <h2 class="solcambio-flow__title">
          Flujo de solicitud de cambios
        </h2>

        <div class="solcambio-flow">

          <div class="solcambio-flow__col">
            <button
              class="solcambio-step solcambio-step--arrow"
              :class="{ 'solcambio-step--active': etapaActiva === 1 }"
              @mouseenter="etapaActiva = 1"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(1)"
            >
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 16V6" />
                <path d="M8 10l4-4 4 4" />
                <path d="M5 18h14" />
              </svg>
              <span class="solcambio-step__text">
                Registrar<br>
                documento
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">Solicitante</span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-flow__col">
            <button
              class="solcambio-step solcambio-step--arrow"
              :class="{ 'solcambio-step--active': etapaActiva === 2 }"
              @mouseenter="etapaActiva = 2"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(2)"
            >
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7h11" />
                <path d="M12 4l3 3-3 3" />
                <path d="M20 17H9" />
                <path d="M12 20l-3-3 3-3" />
              </svg>
              <span class="solcambio-step__text">
                Solicitar cambio<br>
                o baja
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">Solicitante</span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-flow__col">
            <button
              class="solcambio-step solcambio-step--arrow"
              :class="{ 'solcambio-step--active': etapaActiva === 3 }"
              @mouseenter="etapaActiva = 3"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(3)"
            >
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="10" cy="10" r="6" />
                <line x1="14.5" y1="14.5" x2="20" y2="20" />
              </svg>
              <span class="solcambio-step__text">
                Revisión de<br>
                la solicitud
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">Revisor</span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-flow__col">
            <button
              class="solcambio-step solcambio-step--decision"
              :class="{ 'solcambio-step--active': etapaActiva === 4 }"
              @mouseenter="etapaActiva = 4"
              @mouseleave="etapaActiva = null"
              @click="seleccionarEtapa(4)"
            >
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>
              <span class="solcambio-step__text">
                ¿Se aprueba<br>
                el cambio?
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">Aprobador</span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-branch">
            <div class="solcambio-branch__row">
              <span class="solcambio-branch__arrow">→</span>

              <div class="solcambio-branch__col">
                <div class="solcambio-finish solcambio-finish--aprobado">
                  <strong><span class="solcambio-finish__tag">✓</span> Registro actualizado</strong>
                  <span>
                    Sí: el documento y el
                    registro quedan actualizados
                  </span>
                </div>
                <span class="solcambio-flow__role">Automático</span>
              </div>
            </div>

            <div class="solcambio-branch__row">
              <span class="solcambio-branch__arrow">→</span>

              <div class="solcambio-branch__col">
                <div class="solcambio-finish solcambio-finish--rechazado">
                  <strong><span class="solcambio-finish__tag">✕</span> Solicitud rechazada</strong>
                  <span>
                    No: la solicitud se cierra
                    y regresa al solicitante
                  </span>
                </div>
                <span class="solcambio-flow__role">Solicitante</span>
              </div>
            </div>
          </div>

        </div>

      </template>

      <template v-else>

        <h2 class="solcambio-flow__title">
          Selecciona una solicitud para ver su detalle
        </h2>

        <div v-if="solicitudes.length" class="solcambio-lista">
          <button
            v-for="solicitud in solicitudes"
            :key="solicitud.id"
            class="solcambio-item"
            @click="verSolicitud(solicitud)"
          >
            <div class="solcambio-item__main">
              <strong>{{ solicitud.folio }} · {{ solicitud.documento }}</strong>
              <span class="solcambio-item__sub">{{ solicitud.tipoSolicitud }} · {{ solicitud.area }}</span>
            </div>

            <div class="solcambio-item__meta">
              <span class="solcambio-badge" :class="claseEstado(solicitud.estado)">
                {{ solicitud.estado }}
              </span>
              <span class="solcambio-item__fecha">
                {{ solicitud.fechaSolicitud || 'Sin fecha' }}
              </span>
              <span class="solcambio-item__arrow">›</span>
            </div>
          </button>
        </div>

        <div v-else class="solcambio-empty">
          Aún no se han creado solicitudes de cambio.
        </div>

      </template>

    </div>

    <!-- Modal: nueva solicitud -->
    <div
      v-if="mostrarModalNueva"
      class="solcambio-modal-overlay"
      @click.self="cerrarNuevaSolicitud"
    >
      <div class="solcambio-modal">

        <div class="solcambio-modal__header">
          <h3 class="solcambio-modal__title">Nueva solicitud de cambio</h3>
          <button class="solcambio-modal__close" aria-label="Cerrar" @click="cerrarNuevaSolicitud">×</button>
        </div>

        <div class="solcambio-modal__body">
          <form class="solcambio-form" @submit.prevent="guardarNuevaSolicitud">

            <div class="solcambio-form-field">
              <label>Tipo de solicitud</label>
              <select class="solcambio-select" v-model="formNueva.tipoSolicitud">
                <option value="Alta de nuevo documento">Alta de nuevo documento</option>
                <option value="Modificación de documento existente">Modificación de documento existente</option>
                <option value="Baja de documento">Baja de documento</option>
              </select>
            </div>

            <div class="solcambio-form-field">
              <label>Nombre del documento</label>
              <input class="solcambio-input" type="text" v-model="formNueva.documento" placeholder="Ej. Procedimiento de control de calidad" />
            </div>

            <div class="solcambio-row">
              <div class="solcambio-form-field">
                <label>Área / proceso</label>
                <input class="solcambio-input" type="text" v-model="formNueva.area" placeholder="Ej. Calidad" />
              </div>

              <div class="solcambio-form-field">
                <label>Solicitante</label>
                <input class="solcambio-input" type="text" v-model="formNueva.solicitante" placeholder="Nombre de quien solicita" />
              </div>
            </div>

            <div class="solcambio-form-field">
              <label>Descripción de la solicitud</label>
              <textarea class="solcambio-textarea" v-model="formNueva.descripcion" placeholder="Describe el cambio, motivo o alcance de la baja"></textarea>
            </div>

            <div class="solcambio-form-field">
              <label>Adjuntar archivo(s)</label>
              <input class="solcambio-file-input" type="file" multiple @change="onArchivosSeleccionados" />
              <span v-if="formNueva.archivos.length" class="solcambio-form-hint">
                {{ formNueva.archivos.join(', ') }}
              </span>
            </div>

            <span v-if="errorFormNueva" class="solcambio-form-error">{{ errorFormNueva }}</span>

          </form>
        </div>

        <div class="solcambio-modal__footer">
          <button class="solcambio-btn-cancelar" @click="cerrarNuevaSolicitud">Cancelar</button>
          <button class="solcambio-btn-cerrar" @click="guardarNuevaSolicitud">Crear solicitud</button>
        </div>

      </div>
    </div>

    <!-- Modal: detalle / revisión / aprobación -->
    <div
      v-if="mostrarModalDetalle && solicitudSeleccionada"
      class="solcambio-modal-overlay"
      @click.self="cerrarModalDetalle"
    >
      <div class="solcambio-modal">

        <div class="solcambio-modal__header">
          <h3 class="solcambio-modal__title">Detalle de la solicitud</h3>
          <button class="solcambio-modal__close" aria-label="Cerrar" @click="cerrarModalDetalle">×</button>
        </div>

        <div class="solcambio-modal__body">

          <div class="solcambio-field">
            <span class="solcambio-field__label">Documento</span>
            <span class="solcambio-field__value solcambio-field__value--big">
              {{ solicitudSeleccionada.documento }}
            </span>
          </div>

          <div class="solcambio-row">
            <div class="solcambio-field">
              <span class="solcambio-field__label">Folio</span>
              <span class="solcambio-field__value">{{ solicitudSeleccionada.folio }}</span>
            </div>

            <div class="solcambio-field">
              <span class="solcambio-field__label">Estado</span>
              <span class="solcambio-badge" :class="claseEstado(solicitudSeleccionada.estado)">
                {{ solicitudSeleccionada.estado }}
              </span>
            </div>
          </div>

          <div class="solcambio-row">
            <div class="solcambio-field">
              <span class="solcambio-field__label">Tipo de solicitud</span>
              <span class="solcambio-field__value">{{ solicitudSeleccionada.tipoSolicitud }}</span>
            </div>

            <div class="solcambio-field">
              <span class="solcambio-field__label">Área / proceso</span>
              <span class="solcambio-field__value">{{ solicitudSeleccionada.area || 'Sin registrar' }}</span>
            </div>
          </div>

          <div class="solcambio-row">
            <div class="solcambio-field">
              <span class="solcambio-field__label">Solicitante</span>
              <span class="solcambio-field__value">{{ solicitudSeleccionada.solicitante || 'Sin registrar' }}</span>
            </div>

            <div class="solcambio-field">
              <span class="solcambio-field__label">Fecha de solicitud</span>
              <span class="solcambio-field__value">{{ solicitudSeleccionada.fechaSolicitud || 'Sin registrar' }}</span>
            </div>
          </div>

          <div class="solcambio-field">
            <span class="solcambio-field__label">Descripción</span>
            <span class="solcambio-field__value">{{ solicitudSeleccionada.descripcion || 'Sin registrar' }}</span>
          </div>

          <div
            v-if="solicitudSeleccionada.archivos && solicitudSeleccionada.archivos.length"
            class="solcambio-field"
          >
            <span class="solcambio-field__label">Archivos adjuntos</span>

            <div class="solcambio-files">
              <span v-for="archivo in solicitudSeleccionada.archivos" :key="archivo" class="solcambio-file">
                📎 {{ archivo }}
              </span>
            </div>
          </div>

          <!-- Acción de revisión -->
          <div v-if="solicitudSeleccionada.estado === 'Pendiente de revisión'" class="solcambio-decision-box">
            <div class="solcambio-form-field">
              <label>Comentario del revisor</label>
              <textarea class="solcambio-textarea" v-model="comentarioRevisor" placeholder="Observaciones sobre la información recibida"></textarea>
            </div>

            <div class="solcambio-decision-actions">
              <button class="solcambio-btn-rechazar" @click="rechazarEnRevision">Rechazar información</button>
              <button class="solcambio-btn-aprobar" @click="aceptarRevision">Aceptar información</button>
            </div>
          </div>

          <!-- Comentario de revisión ya registrado -->
          <div v-if="solicitudSeleccionada.comentarioRevisor" class="solcambio-field">
            <span class="solcambio-field__label">Comentario del revisor</span>
            <span class="solcambio-field__value">{{ solicitudSeleccionada.comentarioRevisor }}</span>
          </div>

          <!-- Acción de aprobación -->
          <div v-if="solicitudSeleccionada.estado === 'Pendiente de aprobación'" class="solcambio-decision-box">
            <div class="solcambio-form-field">
              <label>Comentario del aprobador</label>
              <textarea class="solcambio-textarea" v-model="comentarioAprobador" placeholder="Justificación de la decisión final"></textarea>
            </div>

            <div class="solcambio-decision-actions">
              <button class="solcambio-btn-rechazar" @click="rechazarCambio">Rechazar cambio</button>
              <button class="solcambio-btn-aprobar" @click="aprobarCambio">Aprobar cambio</button>
            </div>
          </div>

          <!-- Cierre: aprobada -->
          <div
            v-if="solicitudSeleccionada.estado === 'Aprobada'"
            class="solcambio-field solcambio-field--closure"
          >
            <span class="solcambio-field__label">Cierre: cambio aprobado</span>

            <div class="solcambio-row">
              <div class="solcambio-field">
                <span class="solcambio-field__label">Fecha de cierre</span>
                <span class="solcambio-field__value">{{ solicitudSeleccionada.fechaCierre || 'Sin registrar' }}</span>
              </div>

              <div class="solcambio-field">
                <span class="solcambio-field__label">Aprobado por</span>
                <span class="solcambio-field__value">{{ solicitudSeleccionada.aprobador || 'Sin registrar' }}</span>
              </div>
            </div>

            <span class="solcambio-field__label">Comentario del aprobador</span>
            <span class="solcambio-field__value">{{ solicitudSeleccionada.comentarioAprobador || 'Sin registrar' }}</span>
          </div>

          <!-- Cierre: rechazada -->
          <div
            v-if="solicitudSeleccionada.estado === 'Rechazada'"
            class="solcambio-field solcambio-field--closure solcambio-field--rechazo"
          >
            <span class="solcambio-field__label">Cierre: solicitud rechazada</span>

            <div class="solcambio-row">
              <div class="solcambio-field">
                <span class="solcambio-field__label">Fecha de cierre</span>
                <span class="solcambio-field__value">{{ solicitudSeleccionada.fechaCierre || 'Sin registrar' }}</span>
              </div>

              <div class="solcambio-field">
                <span class="solcambio-field__label">Etapa de rechazo</span>
                <span class="solcambio-field__value">{{ solicitudSeleccionada.etapaRechazo || 'Sin registrar' }}</span>
              </div>
            </div>

            <span class="solcambio-field__label">Motivo</span>
            <span class="solcambio-field__value">{{ solicitudSeleccionada.comentarioAprobador || solicitudSeleccionada.comentarioRevisor || 'Sin registrar' }}</span>
          </div>

          <div class="solcambio-field">
            <span class="solcambio-field__label">Historial de la solicitud</span>

            <table v-if="solicitudSeleccionada.historial && solicitudSeleccionada.historial.length" class="solcambio-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Comentario</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in solicitudSeleccionada.historial" :key="index">
                  <td>{{ item.fecha }}</td>
                  <td>{{ item.usuario }}</td>
                  <td>{{ item.comentario }}</td>
                </tr>
              </tbody>
            </table>
            <span v-else class="solcambio-field__value solcambio-field__value--muted">
              Sin movimientos registrados
            </span>
          </div>

        </div>

        <div class="solcambio-modal__footer">
          <button class="solcambio-btn-cerrar" @click="cerrarModalDetalle">Cerrar</button>
        </div>

      </div>
    </div>

  </section>
</template>

<script setup>
import { ref } from "vue";

/* ---------- Navegación entre vistas ---------- */

const vistaActual = ref("flujo");

const abrirSolicitudes = () => {
  vistaActual.value = "solicitudes";
};

const volverAlFlujo = () => {
  vistaActual.value = "flujo";
};

/* ---------- Diagrama de flujo ---------- */

const etapaActiva = ref(null);

const seleccionarEtapa = (etapa) => {
  console.log("Etapa seleccionada:", etapa);

  switch (etapa) {
    case 1:
      console.log("Registrar documento");
      break;

    case 2:
      console.log("Solicitar cambio o baja");
      break;

    case 3:
      console.log("Revisión de la solicitud");
      break;

    case 4:
      console.log("¿Se aprueba el cambio?");
      break;
  }
};

/* ---------- Utilidades ---------- */

const claseEstado = (estado) => {
  switch (estado) {
    case "Aprobada":
      return "solcambio-badge--exito";

    case "Pendiente de aprobación":
      return "solcambio-badge--proceso";

    case "Pendiente de revisión":
      return "solcambio-badge--pendiente";

    case "Rechazada":
      return "solcambio-badge--rechazo";

    default:
      return "solcambio-badge--neutro";
  }
};

const fechaHoy = () => {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = String(hoy.getMonth() + 1).padStart(2, "0");
  const d = String(hoy.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const agregarHistorial = (solicitud, usuario, comentario) => {
  solicitud.historial.push({
    fecha: fechaHoy(),
    usuario,
    comentario,
  });
};

/* ---------- Datos de solicitudes (demo, en memoria) ---------- */

const solicitudes = ref([]);

let siguienteId = 1;

/* ---------- Modal: nueva solicitud ---------- */

const mostrarModalNueva = ref(false);
const errorFormNueva = ref("");

const formNuevaInicial = () => ({
  tipoSolicitud: "Alta de nuevo documento",
  documento: "",
  area: "",
  solicitante: "",
  descripcion: "",
  archivos: [],
});

const formNueva = ref(formNuevaInicial());

const abrirNuevaSolicitud = () => {
  formNueva.value = formNuevaInicial();
  errorFormNueva.value = "";
  mostrarModalNueva.value = true;
};

const cerrarNuevaSolicitud = () => {
  mostrarModalNueva.value = false;
};

const onArchivosSeleccionados = (evento) => {
  const archivos = Array.from(evento.target.files || []);
  formNueva.value.archivos = archivos.map((archivo) => archivo.name);
};

const guardarNuevaSolicitud = () => {
  if (!formNueva.value.documento.trim()) {
    errorFormNueva.value = "Indica el nombre del documento.";
    return;
  }

  if (!formNueva.value.solicitante.trim()) {
    errorFormNueva.value = "Indica quién solicita el cambio.";
    return;
  }

  errorFormNueva.value = "";

  const folio = `SC-${String(siguienteId).padStart(3, "0")}`;
  const hoy = fechaHoy();

  const nuevaSolicitud = {
    id: siguienteId,
    folio,
    tipoSolicitud: formNueva.value.tipoSolicitud,
    documento: formNueva.value.documento.trim(),
    area: formNueva.value.area.trim(),
    solicitante: formNueva.value.solicitante.trim(),
    fechaSolicitud: hoy,
    descripcion: formNueva.value.descripcion.trim(),
    archivos: formNueva.value.archivos,
    estado: "Pendiente de revisión",
    revisor: "",
    comentarioRevisor: "",
    aprobador: "",
    comentarioAprobador: "",
    fechaCierre: "",
    etapaRechazo: "",
    historial: [
      { fecha: hoy, usuario: formNueva.value.solicitante.trim(), comentario: "Solicitud creada" },
    ],
  };

  solicitudes.value.unshift(nuevaSolicitud);
  siguienteId += 1;

  mostrarModalNueva.value = false;
  vistaActual.value = "solicitudes";
};

/* ---------- Modal: detalle / revisión / aprobación ---------- */

const mostrarModalDetalle = ref(false);
const solicitudSeleccionada = ref(null);
const comentarioRevisor = ref("");
const comentarioAprobador = ref("");

const verSolicitud = (solicitud) => {
  solicitudSeleccionada.value = solicitud;
  comentarioRevisor.value = "";
  comentarioAprobador.value = "";
  mostrarModalDetalle.value = true;
};

const cerrarModalDetalle = () => {
  mostrarModalDetalle.value = false;
  solicitudSeleccionada.value = null;
};

const aceptarRevision = () => {
  const solicitud = solicitudSeleccionada.value;
  if (!solicitud) return;

  solicitud.comentarioRevisor = comentarioRevisor.value.trim() || "Información aceptada.";
  solicitud.estado = "Pendiente de aprobación";
  agregarHistorial(solicitud, "Revisor", "Información aceptada, enviada a aprobación");
};

const rechazarEnRevision = () => {
  const solicitud = solicitudSeleccionada.value;
  if (!solicitud) return;

  solicitud.comentarioRevisor = comentarioRevisor.value.trim() || "Información incompleta o no procede.";
  solicitud.estado = "Rechazada";
  solicitud.etapaRechazo = "Revisión";
  solicitud.fechaCierre = fechaHoy();
  agregarHistorial(solicitud, "Revisor", "Solicitud rechazada en revisión");
};

const aprobarCambio = () => {
  const solicitud = solicitudSeleccionada.value;
  if (!solicitud) return;

  solicitud.comentarioAprobador = comentarioAprobador.value.trim() || "Cambio aprobado.";
  solicitud.estado = "Aprobada";
  solicitud.fechaCierre = fechaHoy();
  agregarHistorial(solicitud, "Aprobador", "Cambio aprobado, registro actualizado");
};

const rechazarCambio = () => {
  const solicitud = solicitudSeleccionada.value;
  if (!solicitud) return;

  solicitud.comentarioAprobador = comentarioAprobador.value.trim() || "Cambio no aprobado.";
  solicitud.estado = "Rechazada";
  solicitud.etapaRechazo = "Aprobación";
  solicitud.fechaCierre = fechaHoy();
  agregarHistorial(solicitud, "Aprobador", "Solicitud rechazada en aprobación");
};
</script>

<style>
@import '@/assets/styles/SolicitudCambios.css';
</style>
