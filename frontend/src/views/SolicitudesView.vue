<script setup>
import { onMounted, ref } from 'vue';

import { api } from '@/api/client.js';
import BaseCard from '@/components/BaseCard.vue';
import AppIcon from '@/components/AppIcon.vue';
import StatusBadge from '@/components/StatusBadge.vue';

const solicitudes = ref([]);
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

  if (!esRegistro && !codigo) {
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
        codigo: esRegistro ? '' : codigo,
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
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Solicitudes</h1>
        <p>Gestiona solicitudes de documentos y aprobación de registros.</p>
      </div>
    </div>

    <p v-if="mensaje" class="estado-mensaje estado-exito">
      {{ mensaje }}
    </p>

    <BaseCard title="Solicitudes asignadas">
      <p v-if="cargando" class="muted">
        Cargando solicitudes...
      </p>

      <p v-else-if="error" class="estado-error">
        {{ error }}
      </p>

      <p v-else-if="solicitudes.length === 0" class="muted">
        No tienes solicitudes asignadas.
      </p>

      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>FOLIO</th>
              <th>DOCUMENTO</th>
              <th>TIPO</th>
              <th>VERSIÓN / FECHA</th>
              <th>SOLICITANTE</th>
              <th>ESTADO</th>
              <th>ACCIONES</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="solicitud in solicitudes" :key="solicitud.id">
              <td>
                <code>SOL-{{ solicitud.id }}</code>
              </td>

              <td>
                <strong>{{ solicitud.documento }}</strong>
              </td>

              <td>{{ solicitud.tipo_solicitud }}</td>

              <td>
                <template v-if="solicitud.es_registro">
                  {{ formatearFecha(solicitud.fecha_registro) }}
                </template>

                <template v-else>
                  v{{ solicitud.version }}
                </template>
              </td>

              <td>{{ solicitud.solicitante }}</td>

              <td>
                <StatusBadge :estado="solicitud.estado" />
              </td>

              <td>
                <button class="btn btn-ghost btn-sm" type="button" :disabled="Boolean(accionArchivo)"
                  @click="verPdf(solicitud)">
                  <AppIcon name="search" :size="14" />

                  {{
                    accionArchivo ===
                      `${solicitud.es_registro ? 'registro' : 'pdf'}-${solicitud.id}`
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
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </BaseCard>
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
            !solicitudSeleccionada?.es_registro
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

            <button class="btn btn-ghost" type="button" :disabled="procesandoDecision" @click="devolverSeleccionada">
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
                    : 'Aprobar y publicar'
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

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
