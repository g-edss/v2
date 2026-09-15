<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { api } from '@/api/client.js';
import { useAuthStore } from '@/stores/auth.js';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';

const auth = useAuthStore();
const router = useRouter();
const solicitudes = ref([]);
const vistaActual = ref('flujo');
const etapaActiva = ref(null);
const mostrarModalNueva = ref(false);
const cargandoCatalogos = ref(false);
const procesandoNueva = ref(false);
const errorNueva = ref('');

const documentosDisponibles = ref([]);
const procesosDisponibles = ref([]);

function formularioNuevaInicial() {
  return {
    tipoClave: 'alta',
    documentoId: '',
    nombreDocumento: '',
    procesoId: '',
    solicitante: '',
    descripcion: '',
    archivos: [],
  };
}

const formNueva = ref(formularioNuevaInicial());

const documentoSeleccionado = computed(() =>
  documentosDisponibles.value.find(
    documento =>
      Number(documento.id) ===
      Number(formNueva.value.documentoId),
  ) || null,
);

function abrirSolicitudes() {
  vistaActual.value = 'solicitudes';
}

function volverAlFlujo() {
  vistaActual.value = 'flujo';
}

function activarEtapa(etapa) {
  etapaActiva.value = etapa;
}

function desactivarEtapa() {
  etapaActiva.value = null;
}

async function cargarCatalogosNueva() {
  cargandoCatalogos.value = true;
  errorNueva.value = '';

  try {
    const [
      documentos,
      procesos,
    ] = await Promise.all([
      api.get('/documentos'),
      api.get('/procesos'),
    ]);

    documentosDisponibles.value =
      documentos.filter(
        documento =>
          documento.estado === 'vigente',
      );

    procesosDisponibles.value =
      procesos.filter(
        proceso =>
          proceso.estatus === 'activo',
      );
  } catch (err) {
    errorNueva.value =
      err.message ||
      'No se pudieron cargar los catálogos.';
  } finally {
    cargandoCatalogos.value = false;
  }
}

async function abrirNuevaSolicitud() {
  formNueva.value = formularioNuevaInicial();
  formNueva.value.solicitante =
    auth.usuario?.nombre || '';
  errorNueva.value = '';
  mostrarModalNueva.value = true;

  await cargarCatalogosNueva();
}

function cerrarNuevaSolicitud() {
  if (procesandoNueva.value) {
    return;
  }

  mostrarModalNueva.value = false;
  errorNueva.value = '';
}

const cargando = ref(false);
const error = ref('');
const mensaje = ref('');
const accionArchivo = ref('');
const decisionAbierta = ref(false);
const solicitudSeleccionada = ref(null);
const procesandoDecision = ref(false);
const comentarioDecision = ref('');
const codigoDecision = ref('');

function abrirDecision(solicitud) {
  error.value = '';
  comentarioDecision.value = '';
  codigoDecision.value = '';
  solicitudSeleccionada.value = solicitud;
  decisionAbierta.value = true;
}

function cerrarDecision() {
  if (procesandoDecision.value) {
    return;
  }

  decisionAbierta.value = false;
  solicitudSeleccionada.value = null;
  comentarioDecision.value = '';
  codigoDecision.value = '';
  error.value = '';
}

function formatearFecha(valor) {
  if (!valor) {
    return '—';
  }

  const [anio, mes, dia] = valor
    .slice(0, 10)
    .split('-');

  return `${dia}/${mes}/${anio}`;
}

function claseEstado(estado) {
  const valor = String(estado || '').toLowerCase();

  if (valor.includes('aprobad')) {
    return 'solcambio-badge--exito';
  }

  if (valor.includes('rechaz')) {
    return 'solcambio-badge--rechazo';
  }

  if (
    valor.includes('revisor') ||
    valor.includes('aprobador') ||
    valor.includes('responsable')
  ) {
    return 'solcambio-badge--proceso';
  }

  if (valor.includes('correccion')) {
    return 'solcambio-badge--pendiente';
  }

  return 'solcambio-badge--neutro';
}

function etiquetaEstado(estado) {
  const etiquetas = {
    pendiente: 'Pendiente',
    en_responsable: 'Con responsable',
    en_revisor: 'Con revisor',
    en_aprobador: 'Con aprobador',
    correcciones: 'Requiere correcciones',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada'
  };

  return etiquetas[estado] || estado;
}

function textoAsignacion(solicitud) {
  const participantes = [
    solicitud.responsable
      ? `Responsable: ${solicitud.responsable}`
      : null,
    solicitud.revisor
      ? `Revisor: ${solicitud.revisor}`
      : 'Sin revisor',
    solicitud.aprobador
      ? `Aprobador: ${solicitud.aprobador}`
      : null,
  ].filter(Boolean);

  return participantes.join(' · ');
}

async function descargarArchivoSolicitud(solicitud, archivo) {
  error.value = '';
  accionArchivo.value = `solicitud-${archivo.id}`;

  try {
    const blob = await api.getBlob(
      `/solicitudes/${solicitud.id}/archivos/${archivo.id}`,
    );

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download = archivo.nombre_archivo || 'archivo';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  } catch (err) {
    error.value =
      err.message || 'No se pudo descargar el archivo adjunto.';
  } finally {
    accionArchivo.value = '';
  }
}

async function verPdf(solicitud) {
  error.value = '';

  if (solicitud.es_registro) {
    accionArchivo.value = `registro-${solicitud.id}`;

    try {
      const blob = await api.getBlob(
        `/registros/${solicitud.registro_id}/archivo`
      );

      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');

      enlace.href = url;
      enlace.download =
        solicitud.nombre_archivo || 'registro';

      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();

      URL.revokeObjectURL(url);
    } catch (err) {
      error.value =
        err.message ||
        'No se pudo descargar la evidencia.';
    } finally {
      accionArchivo.value = '';
    }

    return;
  }

  const ventana = window.open('', '_blank');

  if (!ventana) {
    error.value =
      'El navegador bloqueó la nueva pestaña.';
    return;
  }

  ventana.document.title = 'Cargando PDF...';
  ventana.document.body.textContent =
    'Cargando documento...';

  accionArchivo.value = `pdf-${solicitud.id}`;

  try {
    const blob = await api.getBlob(
      `/documentos/${solicitud.documento_id}` +
      `/versiones/${solicitud.version_documento_id}` +
      '/pdf'
    );

    const url = URL.createObjectURL(blob);
    ventana.location.href = url;

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 300000);
  } catch (err) {
    ventana.close();

    error.value =
      err.message || 'No se pudo abrir el PDF.';
  } finally {
    accionArchivo.value = '';
  }
}

async function avanzarSeleccionada() {
  if (
    !solicitudSeleccionada.value ||
    procesandoDecision.value
  ) {
    return;
  }

  procesandoDecision.value = true;
  error.value = '';
  mensaje.value = '';

  try {
    const respuesta = await api.post(
      `/solicitudes/${solicitudSeleccionada.value.id}` +
      '/avanzar',
      {
        comentario:
          comentarioDecision.value.trim() || null,
      },
    );

    decisionAbierta.value = false;
    solicitudSeleccionada.value = null;
    comentarioDecision.value = '';

    await cargarSolicitudes();

    mensaje.value =
      respuesta.mensaje ||
      'La solicitud avanzó a la siguiente etapa.';
  } catch (err) {
    error.value =
      err.message ||
      'No se pudo avanzar la solicitud.';
  } finally {
    procesandoDecision.value = false;
  }
}

async function aprobarSeleccionada() {
  if (
    !solicitudSeleccionada.value ||
    procesandoDecision.value
  ) {
    return;
  }

  const esRegistro =
    solicitudSeleccionada.value.es_registro;

  const codigo = codigoDecision.value
    .trim()
    .toUpperCase();

  const requiereCodigo =
    !esRegistro &&
    solicitudSeleccionada.value.tipo_clave === 'alta';

  if (requiereCodigo && !codigo) {
    error.value =
      'Debes asignar el código institucional.';
    return;
  }

  procesandoDecision.value = true;
  error.value = '';
  mensaje.value = '';

  try {
    const respuesta = await api.post(
      `/solicitudes/${solicitudSeleccionada.value.id}` +
      '/aprobar',
      {
        comentario:
          comentarioDecision.value || null,
        codigo: requiereCodigo ? codigo : '',
      },
    );

    decisionAbierta.value = false;
    solicitudSeleccionada.value = null;
    comentarioDecision.value = '';
    codigoDecision.value = '';

    await cargarSolicitudes();

    mensaje.value =
      respuesta.mensaje ||
      'La solicitud fue aprobada correctamente.';
  } catch (err) {
    error.value =
      err.message ||
      'No se pudo aprobar la solicitud.';
  } finally {
    procesandoDecision.value = false;
  }
}

async function devolverSeleccionada() {
  if (
    !solicitudSeleccionada.value ||
    procesandoDecision.value
  ) {
    return;
  }

  const comentario = comentarioDecision.value.trim();

  if (!comentario) {
    error.value =
      'Escribe las correcciones que debe realizar el elaborador.';
    return;
  }

  procesandoDecision.value = true;
  error.value = '';
  mensaje.value = '';

  try {
    const respuesta = await api.post(
      `/solicitudes/${solicitudSeleccionada.value.id}` +
      '/correcciones',
      { comentario },
    );

    decisionAbierta.value = false;
    solicitudSeleccionada.value = null;
    comentarioDecision.value = '';

    await cargarSolicitudes();

    mensaje.value =
      respuesta.mensaje ||
      'El documento fue devuelto para correcciones.';
  } catch (err) {
    error.value =
      err.message ||
      'No se pudo devolver el documento.';
  } finally {
    procesandoDecision.value = false;
  }
}

async function rechazarSeleccionada() {
  if (
    !solicitudSeleccionada.value ||
    procesandoDecision.value
  ) {
    return;
  }

  const comentario = comentarioDecision.value.trim();

  if (!comentario) {
    error.value =
      'Escribe el motivo del rechazo.';
    return;
  }

  procesandoDecision.value = true;
  error.value = '';
  mensaje.value = '';

  try {
    const respuesta = await api.post(
      `/solicitudes/${solicitudSeleccionada.value.id}` +
      '/rechazar',
      { comentario },
    );

    decisionAbierta.value = false;
    solicitudSeleccionada.value = null;
    comentarioDecision.value = '';

    await cargarSolicitudes();

    mensaje.value =
      respuesta.mensaje ||
      'La solicitud fue rechazada.';
  } catch (err) {
    error.value =
      err.message ||
      'No se pudo rechazar la solicitud.';
  } finally {
    procesandoDecision.value = false;
  }
}

function seleccionarArchivos(evento) {
  formNueva.value.archivos =
    Array.from(evento.target.files || []);
}

async function guardarNuevaSolicitud() {
  if (procesandoNueva.value) {
    return;
  }

  if (formNueva.value.tipoClave === 'alta') {
    const nombreDocumento =
      formNueva.value.nombreDocumento.trim();

    const procesoId =
      Number(formNueva.value.procesoId);

    const descripcion =
      formNueva.value.descripcion.trim();

    if (!nombreDocumento) {
      errorNueva.value =
        'Debes escribir el nombre del documento.';
      return;
    }

    if (!Number.isInteger(procesoId)) {
      errorNueva.value =
        'Debes seleccionar un proceso.';
      return;
    }

    if (!descripcion) {
      errorNueva.value =
        'Debes describir la solicitud.';
      return;
    }

    mostrarModalNueva.value = false;

    await router.push({
      name: 'documentos',
      query: {
        nuevo: '1',
        nombre: nombreDocumento,
        procesoId,
        descripcion,
      },
    });

    return;
  }

  const documentoId = Number(formNueva.value.documentoId);

  const descripcion = formNueva.value.descripcion.trim();

  if (!Number.isInteger(documentoId)) {
    errorNueva.value =
      'Debes seleccionar un documento.';
    return;
  }

  if (!descripcion) {
    errorNueva.value =
      'Debes explicar el motivo de la solicitud.';
    return;
  }

  if (
    formNueva.value.tipoClave === 'cambio' &&
    formNueva.value.archivos.length === 0
  ) {
    errorNueva.value =
      'Adjunta el archivo que se convertirá en la nueva versión.';
    return;
  }

  const datos = new FormData();

  datos.append( 'tipoClave', formNueva.value.tipoClave );

  datos.append( 'documentoId', String(documentoId) );

  datos.append( 'descripcion', descripcion );

  for (const archivo of formNueva.value.archivos) {
    datos.append( 'archivos', archivo );
  }

  procesandoNueva.value = true;
  errorNueva.value = '';
  mensaje.value = '';

  try {
    const respuesta = await api.postForm( '/solicitudes', datos );

    mostrarModalNueva.value = false;
    formNueva.value = formularioNuevaInicial();
    vistaActual.value = 'solicitudes';

    await cargarSolicitudes();

    mensaje.value =
      respuesta.mensaje ||
      'La solicitud fue creada correctamente.';
  } catch (err) {
    errorNueva.value =
      err.message ||
      'No se pudo crear la solicitud.';
  } finally {
    procesandoNueva.value = false;
  }
}

async function cargarSolicitudes() {
  cargando.value = true;
  error.value = '';

  try {
    solicitudes.value = await api.get('/solicitudes');
  } catch (err) {
    error.value =
      err.message || 'No se pudieron cargar las solicitudes.';
  } finally {
    cargando.value = false;
  }
}

onMounted(cargarSolicitudes);
</script>

<template>
  <section class="solcambio-page">
    <div class="solcambio-page__top">
      <h1 class="solcambio-page__title">
        Solicitud de Cambios
      </h1>

      <span class="solcambio-page__icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
          stroke-linejoin="round">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M20 3.5l0.5 0.5-8 8-3 1 1-3 8-8z" />
        </svg>
      </span>
    </div>

    <div class="solcambio-card">
      <div class="solcambio-card__actions">
        <template v-if="vistaActual === 'flujo'">
          <button class="solcambio-btn solcambio-btn--solido" type="button" @click="abrirNuevaSolicitud">
            <span>+</span>
            Nueva solicitud
          </button>

          <button class="solcambio-btn" type="button" @click="abrirSolicitudes">
            <span>▥</span>
            Solicitudes
          </button>
        </template>

        <button v-else class="solcambio-btn" type="button" @click="volverAlFlujo">
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
            <button class="solcambio-step solcambio-step--arrow" :class="{
              'solcambio-step--active': etapaActiva === 1
            }" type="button" @mouseenter="activarEtapa(1)" @mouseleave="desactivarEtapa">
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 16V6" />
                <path d="M8 10l4-4 4 4" />
                <path d="M5 18h14" />
              </svg>

              <span class="solcambio-step__text">
                Registrar<br />
                documento
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">
              Solicitante
            </span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-flow__col">
            <button class="solcambio-step solcambio-step--arrow" :class="{
              'solcambio-step--active': etapaActiva === 2
            }" type="button" @mouseenter="activarEtapa(2)" @mouseleave="desactivarEtapa">
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 7h11" />
                <path d="M12 4l3 3-3 3" />
                <path d="M20 17H9" />
                <path d="M12 20l-3-3 3-3" />
              </svg>

              <span class="solcambio-step__text">
                Solicitar cambio<br />
                o baja
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">
              Solicitante
            </span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-flow__col">
            <button class="solcambio-step solcambio-step--arrow" :class="{
              'solcambio-step--active': etapaActiva === 3
            }" type="button" @mouseenter="activarEtapa(3)" @mouseleave="desactivarEtapa">
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="10" cy="10" r="6" />
                <line x1="14.5" y1="14.5" x2="20" y2="20" />
              </svg>

              <span class="solcambio-step__text">
                Revisión de<br />
                la solicitud
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">
              Revisor
            </span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-flow__col">
            <button class="solcambio-step solcambio-step--decision" :class="{
              'solcambio-step--active': etapaActiva === 4
            }" type="button" @mouseenter="activarEtapa(4)" @mouseleave="desactivarEtapa">
              <svg class="solcambio-step__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 12l2 2 4-4" />
                <circle cx="12" cy="12" r="9" />
              </svg>

              <span class="solcambio-step__text">
                ¿Se aprueba<br />
                el cambio?
              </span>
            </button>

            <span class="solcambio-connector">
              <span class="solcambio-connector__line"></span>
              <span class="solcambio-connector__dot"></span>
            </span>

            <span class="solcambio-flow__role">
              Aprobador
            </span>
          </div>

          <span class="solcambio-flow__arrow">→</span>

          <div class="solcambio-branch">
            <div class="solcambio-branch__row">
              <span class="solcambio-branch__arrow">→</span>

              <div class="solcambio-branch__col">
                <div class=" solcambio-finish solcambio-finish--aprobado">
                  <strong>
                    <span class="solcambio-finish__tag">✓</span>
                    Registro actualizado
                  </strong>

                  <span>
                    Sí: el documento y el registro quedan actualizados
                  </span>
                </div>

                <span class="solcambio-flow__role">
                  Automático
                </span>
              </div>
            </div>

            <div class="solcambio-branch__row">
              <span class="solcambio-branch__arrow">→</span>

              <div class="solcambio-branch__col">
                <div class="solcambio-finish solcambio-finish--rechazado">
                  <strong>
                    <span class="solcambio-finish__tag">✕</span>
                    Solicitud rechazada
                  </strong>

                  <span>
                    No: la solicitud se cierra y regresa al solicitante
                  </span>
                </div>

                <span class="solcambio-flow__role">
                  Solicitante
                </span>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <h2 class="solcambio-flow__title">
          Selecciona una solicitud para ver su detalle
        </h2>

        <p v-if="mensaje" class="estado-mensaje estado-exito">
          {{ mensaje }}
        </p>

        <p v-if="cargando" class="solcambio-empty">
          Cargando solicitudes...
        </p>

        <p v-else-if="error" class="estado-mensaje estado-error">
          {{ error }}
        </p>

        <div v-else-if="solicitudes.length === 0" class="solcambio-empty">
          No tienes solicitudes asignadas.
        </div>

        <div v-else class="solcambio-lista">
          <article v-for="solicitud in solicitudes" :key="solicitud.id" class="solcambio-item">
            <div class="solcambio-item__main">
              <strong>
                SOL-{{ solicitud.id }} ·
                {{ solicitud.documento }}
              </strong>

              <span class="solcambio-item__sub">
                {{ solicitud.tipo_solicitud }} ·
                {{ solicitud.solicitante }}
              </span>

              <span v-if="solicitud.proceso" class="solcambio-item__sub">
                Proceso: {{ solicitud.proceso }}
              </span>

              <span class="solcambio-item__asignacion">
                {{ textoAsignacion(solicitud) }}
              </span>

              <span v-if="solicitud.descripcion" class="solcambio-item__descripcion">
                {{ solicitud.descripcion }}
              </span>

              <div v-if="solicitud.archivos?.length" class="solcambio-item__archivos">
                <button v-for="archivo in solicitud.archivos" :key="archivo.id" class="btn btn-ghost btn-sm"
                  type="button" :disabled="Boolean(accionArchivo)"
                  @click="descargarArchivoSolicitud(solicitud, archivo)">
                  <AppIcon name="file" :size="14" />
                  {{
                    accionArchivo === `solicitud-${archivo.id}`
                      ? 'Descargando...'
                      : archivo.nombre_archivo
                  }}
                </button>
              </div>
            </div>

            <div class="solcambio-item__meta">
              <span class="solcambio-badge" :class="claseEstado(solicitud.estado)">
                {{ etiquetaEstado(solicitud.estado) }}
              </span>

              <span class="solcambio-item__fecha">
                {{ formatearFecha(solicitud.creado_en) }}
              </span>

              <button class="btn btn-ghost btn-sm" type="button" :disabled="Boolean(accionArchivo)"
                @click="verPdf(solicitud)">
                <AppIcon name="search" :size="14" />

                {{
                  accionArchivo ===
                    `${solicitud.es_registro
                      ? 'registro'
                      : 'pdf'}-${solicitud.id}`
                    ? solicitud.es_registro
                      ? 'Descargando...'
                      : 'Abriendo...'
                    : solicitud.es_registro
                      ? 'Descargar evidencia'
                      : 'Ver PDF'
                }}
              </button>

              <button v-if="solicitud.puede_atender" class="btn btn-primary btn-sm" type="button"
                :disabled="Boolean(accionArchivo)" @click="abrirDecision(solicitud)">
                Atender
              </button>

              <span v-if="solicitud.puede_atender" class="solcambio-item__arrow">
                ›
              </span>
            </div>
          </article>
        </div>
      </template>
    </div>

    <div v-if="mostrarModalNueva" class="solcambio-modal-overlay" @click.self="cerrarNuevaSolicitud">
      <div class="solcambio-modal" role="dialog" aria-modal="true" aria-labelledby="titulo-nueva-solicitud">
        <div class="solcambio-modal__header">
          <h2 id="titulo-nueva-solicitud" class="solcambio-modal__title">
            Nueva solicitud de cambio
          </h2>

          <button class="solcambio-modal__close" type="button" aria-label="Cerrar" :disabled="procesandoNueva"
            @click="cerrarNuevaSolicitud">
            ×
          </button>
        </div>

        <form @submit.prevent="guardarNuevaSolicitud">
          <div class="solcambio-modal__body">
            <p v-if="cargandoCatalogos" class="solcambio-empty">
              Cargando datos del formulario...
            </p>

            <template v-else>
              <div class="solcambio-form">
                <div class="solcambio-form-field">
                  <label for="tipo-nueva-solicitud">
                    Tipo de solicitud
                  </label>

                  <select id="tipo-nueva-solicitud" v-model="formNueva.tipoClave" class="solcambio-select" required
                    :disabled="procesandoNueva">
                    <option value="alta">
                      Alta de nuevo documento
                    </option>

                    <option value="cambio">
                      Modificación de documento existente
                    </option>

                    <option value="baja">
                      Baja de documento
                    </option>
                  </select>
                </div>

                <div class="solcambio-form-field">
                  <label for="documento-nueva-solicitud">
                    Nombre del documento
                  </label>

                  <input v-if="formNueva.tipoClave === 'alta'" id="documento-nueva-solicitud"
                    v-model="formNueva.nombreDocumento" class="solcambio-input" type="text" maxlength="200" required
                    :disabled="procesandoNueva" placeholder="Ej. Procedimiento de control de calidad" />

                  <select v-else id="documento-nueva-solicitud" v-model="formNueva.documentoId" class="solcambio-select"
                    required :disabled="procesandoNueva">
                    <option value="" disabled>
                      Selecciona un documento vigente
                    </option>

                    <option v-for="documento in documentosDisponibles" :key="documento.id" :value="documento.id">
                      {{ documento.codigo }} · {{ documento.nombre }}
                    </option>
                  </select>

                  <span v-if="
                    formNueva.tipoClave !== 'alta' &&
                    documentosDisponibles.length === 0
                  " class="solcambio-form-hint">
                    No hay documentos vigentes disponibles.
                  </span>
                </div>

                <div class="solcambio-row">
                  <div class="solcambio-form-field">
                    <label for="proceso-nueva-solicitud">
                      Área / proceso
                    </label>

                    <select v-if="formNueva.tipoClave === 'alta'" id="proceso-nueva-solicitud"
                      v-model="formNueva.procesoId" class="solcambio-select" required :disabled="procesandoNueva">
                      <option value="" disabled>
                        Selecciona un proceso
                      </option>

                      <option v-for="proceso in procesosDisponibles" :key="proceso.id" :value="proceso.id">
                        {{ proceso.nombre }}
                      </option>
                    </select>

                    <input v-else id="proceso-nueva-solicitud" class="solcambio-input" type="text" readonly :value="documentoSeleccionado?.proceso ||
                      'Selecciona un documento'
                      " />
                  </div>

                  <div class="solcambio-form-field">
                    <label for="solicitante-nueva-solicitud">
                      Solicitante
                    </label>

                    <input id="solicitante-nueva-solicitud" class="solcambio-input" type="text" readonly
                      :value="formNueva.solicitante" placeholder="Nombre de quien solicita" />
                  </div>
                </div>

                <div class="solcambio-form-field">
                  <label for="descripcion-nueva-solicitud">
                    Descripción de la solicitud
                  </label>

                  <textarea id="descripcion-nueva-solicitud" v-model="formNueva.descripcion" class="solcambio-textarea"
                    maxlength="2000" required :disabled="procesandoNueva"
                    placeholder="Describe el cambio, motivo o alcance de la baja"></textarea>
                </div>

                <div v-if="formNueva.tipoClave !== 'alta'" class="solcambio-form-field">
                  <label for="archivos-nueva-solicitud">
                    Adjuntar archivo(s)
                  </label>

                  <input id="archivos-nueva-solicitud" class="solcambio-file-input" type="file" multiple
                    :disabled="procesandoNueva" @change="seleccionarArchivos" />

                  <span v-if="formNueva.archivos.length" class="solcambio-form-hint">
                    {{
                      formNueva.archivos
                        .map(archivo => archivo.name)
                        .join(', ')
                    }}
                  </span>

                  <span class="solcambio-form-hint">
                    {{
                      formNueva.tipoClave === 'cambio'
                        ? 'El primer archivo será la nueva versión del documento; los demás quedarán como evidencia.'
                        : 'Puedes adjuntar evidencia que justifique la baja.'
                    }}
                  </span>
                </div>

                <span v-else class="solcambio-form-hint">
                  El archivo principal se seleccionará en Control de Documentos.
                </span>

                <span v-if="errorNueva" class="solcambio-form-error">
                  {{ errorNueva }}
                </span>
              </div>
            </template>
          </div>

          <div class="solcambio-modal__footer">
            <button class="solcambio-btn-cancelar" type="button" :disabled="procesandoNueva"
              @click="cerrarNuevaSolicitud">
              Cancelar
            </button>

            <button class="solcambio-btn-cerrar" type="submit" :disabled="cargandoCatalogos ||
              procesandoNueva ||
              (
                formNueva.tipoClave !== 'alta' &&
                documentosDisponibles.length === 0
              )
              ">
              {{
                procesandoNueva
                  ? 'Creando...'
                  : 'Crear solicitud'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="decisionAbierta" class="overlay" @click.self="cerrarDecision">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2>Atender solicitud</h2>
            <p>
              SOL-{{ solicitudSeleccionada?.id }} ·
              {{ solicitudSeleccionada?.documento }}
            </p>
          </div>

          <button class="modal-close" type="button" :disabled="procesandoDecision" @click="cerrarDecision">
            ✕
          </button>
        </div>

        <div class="modal-body">
          <label v-if="
            solicitudSeleccionada?.estado === 'en_aprobador' &&
            solicitudSeleccionada?.tipo_clave === 'alta'
          " class="campo">
            <span>Código institucional *</span>

            <input v-model.trim="codigoDecision" type="text" maxlength="60" required placeholder="Ej. MAN-SDS-01"
              @input="
                codigoDecision =
                codigoDecision.toUpperCase()
                " />

            <small>
              Debe ser único. Usa la nomenclatura institucional
              correspondiente al tipo de documento.
            </small>
          </label>
          <label class="campo">
            <span>Observaciones</span>

            <textarea v-model.trim="comentarioDecision" rows="4" maxlength="2000"
              placeholder="Escribe observaciones sobre el documento..."></textarea>

            <small>
              El comentario es opcional al aprobar.
            </small>
          </label>

          <p v-if="error" class="form-error">
            {{ error }}
          </p>

          <div class="modal-actions">
            <button class="btn btn-ghost" type="button" :disabled="procesandoDecision" @click="cerrarDecision">
              Cancelar
            </button>

            <button v-if="
              solicitudSeleccionada?.es_registro ||
              solicitudSeleccionada?.tipo_clave === 'alta'
            " class="btn btn-ghost" type="button" :disabled="procesandoDecision" @click="devolverSeleccionada">
              {{
                procesandoDecision
                  ? 'Procesando...'
                  : 'Solicitar correcciones'
              }}
            </button>

            <button class="btn btn-danger" type="button" :disabled="procesandoDecision" @click="rechazarSeleccionada">
              {{
                procesandoDecision
                  ? 'Procesando...'
                  : 'Rechazar'
              }}
            </button>

            <button v-if="
              solicitudSeleccionada?.estado === 'en_responsable' ||
              solicitudSeleccionada?.estado === 'en_revisor'
            " class="btn btn-primary" type="button" :disabled="procesandoDecision" @click="avanzarSeleccionada">
              {{
                procesandoDecision
                  ? 'Procesando...'
                  : 'Aprobar etapa'
              }}
            </button>

            <button v-if="
              solicitudSeleccionada?.estado === 'en_aprobador'
            " class="btn btn-primary" type="button" :disabled="procesandoDecision" @click="aprobarSeleccionada">
              {{
                procesandoDecision
                  ? 'Aprobando...'
                  : solicitudSeleccionada?.es_registro
                    ? 'Aprobar registro'
                    : solicitudSeleccionada?.tipo_clave === 'baja'
                      ? 'Aprobar baja'
                      : solicitudSeleccionada?.tipo_clave === 'cambio'
                        ? 'Aprobar nueva versión'
                        : 'Aprobar y publicar'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style>
@import '@/assets/styles/SolicitudCambios.css';
</style>

<style scoped>
.empty {
  text-align: center;
  padding: 48px 20px;
}

.empty-icon {
  width: 60px;
  height: 60px;
  margin: 0 auto 16px;
  border-radius: 14px;
  background: var(--brand-100);
  color: var(--brand-700);
  display: grid;
  place-items: center;
}

.empty h3 {
  font-size: 16px;
  margin-bottom: 6px;
}

.empty p {
  max-width: 420px;
  margin: 0 auto;
  font-size: 13px;
}

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
  max-width: 620px;
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
  box-shadow: var(--shadow-md);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 15px 20px;
  color: #fff;
  background: var(--brand-800);
}

.modal-head h2 {
  margin: 0;
  color: #fff;
  font-size: 17px;
}

.modal-head p {
  margin: 3px 0 0;
  color: var(--brand-200);
  font-size: 12px;
}

.modal-close {
  border: 0;
  color: #fff;
  background: transparent;
  font-size: 22px;
  cursor: pointer;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 22px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.estado-mensaje {
  margin: 0;
  padding: 11px 13px;
  border-radius: 8px;
  font-size: 13px;
}

.estado-exito {
  color: var(--brand-700);
  background: var(--brand-100);
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: var(--gray-700);
  font-size: 13px;
  font-weight: 600;
}

.campo input,
.campo textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--gray-900);
  background: #fff;
  font: inherit;
  font-weight: 400;
  outline: none;
}

.campo textarea {
  resize: vertical;
}

.campo input:focus,
.campo textarea:focus {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-100);
}

.campo small {
  color: var(--gray-500);
  font-size: 11px;
  font-weight: 400;
}

.form-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--danger);
  background: var(--danger-bg);
  font-size: 13px;
}

.btn-danger {
  color: var(--danger);
  border-color: var(--danger);
  background: var(--danger-bg);
}

.btn-danger:hover {
  color: #fff;
  background: var(--danger);
}
</style>
