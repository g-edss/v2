<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api/client.js';
import { useAuthStore } from '@/stores/auth.js';
import AppIcon from '@/components/AppIcon.vue';
import BaseCard from '@/components/BaseCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';

const auth = useAuthStore();
const documentos = ref([]);
const tiposDocumento = ref([]);
const procesos = ref([]);

const participantes = ref([]);

const puedeIniciarFlujo = computed(() =>
  ['admin_general', 'responsable'].includes(
    auth.usuario?.rol_clave,
  ),
);

const responsables = computed(() =>
  participantes.value.filter(
    (usuario) => usuario.rol_clave === 'responsable',
  ),
);

const revisores = computed(() =>
  participantes.value.filter(
    (usuario) => usuario.rol_clave === 'revisor',
  ),
);

const aprobadores = computed(() =>
  participantes.value.filter(
    (usuario) => usuario.rol_clave === 'aprobador',
  ),
);

const formularioAbierto = ref(false);
const cargandoCatalogos = ref(false);
const guardando = ref(false);
const mensaje = ref('');
const error = ref('');
const archivoInput = ref(null);
const accionArchivo = ref('');

const revisionAbierta = ref(false);
const documentoRevision = ref(null);
const enviandoRevision = ref(false);
const correccionAbierta = ref(false);
const documentoCorreccion = ref(null);
const guardandoCorreccion = ref(false);
const archivoCorreccion = ref(null);
const archivoCorreccionInput = ref(null);

const formularioRevision = ref({
  responsable_id: '',
  revisor_id: '',
  aprobador_id: '',
  comentario: '',
});

const formulario = ref({
  nombre: '',
  tipo_documento_id: '',
  origen: 'interno',
  proceso_id: '',
  version: '1.0',
  archivo: null,
});

function abrirCorreccion(documento) {
  error.value = '';
  archivoCorreccion.value = null;
  documentoCorreccion.value = documento;
  correccionAbierta.value = true;

  if (archivoCorreccionInput.value) {
    archivoCorreccionInput.value.value = '';
  }
}

function cerrarCorreccion() {
  if (guardandoCorreccion.value) {
    return;
  }

  correccionAbierta.value = false;
  documentoCorreccion.value = null;
  archivoCorreccion.value = null;
  error.value = '';

  if (archivoCorreccionInput.value) {
    archivoCorreccionInput.value.value = '';
  }
}

function seleccionarArchivoCorreccion(event) {
  archivoCorreccion.value =
    event.target.files?.[0] || null;
}

async function guardarCorreccion() {
  error.value = '';
  mensaje.value = '';

  if (
    !documentoCorreccion.value ||
    guardandoCorreccion.value
  ) {
    return;
  }

  if (!archivoCorreccion.value) {
    error.value = 'Debes seleccionar el archivo corregido.';
    return;
  }

  const datos = new FormData();
  datos.append('archivo', archivoCorreccion.value);

  guardandoCorreccion.value = true;
  let guardada = false;

  try {
    const documento = documentoCorreccion.value;

    const respuesta = await api.postForm(
      `/documentos/${documento.id}` +
      `/versiones/${documento.version_id}` +
      '/correccion',
      datos,
    );

    documento.nombre_original =
      respuesta.version.nombre_original;
    documento.estado_conversion =
      respuesta.version.estado_conversion;
    documento.estado = 'en_revision';
    documento.solicitud_estado = null;

    mensaje.value = respuesta.mensaje;
    guardada = true;
  } catch (err) {
    error.value =
      err.message || 'No se pudo guardar la corrección.';
  } finally {
    guardandoCorreccion.value = false;
  }

  if (guardada) {
    cerrarCorreccion();
  }
}

function abrirRevision(documento) {
  error.value = '';

  formularioRevision.value = {
    responsable_id: '',
    revisor_id: '',
    aprobador_id: '',
    comentario: '',
  };

  documentoRevision.value = documento;
  revisionAbierta.value = true;
}

function cerrarRevision() {
  if (enviandoRevision.value) {
    return;
  }

  revisionAbierta.value = false;
  documentoRevision.value = null;
  error.value = '';
}

function limpiarFormulario() {
  formulario.value = {
    nombre: '',
    tipo_documento_id: '',
    origen: 'interno',
    proceso_id: '',
    version: '1.0',
    archivo: null,
  };

  if (archivoInput.value) {
    archivoInput.value.value = '';
  }
}

function abrirFormulario() {
  error.value = '';
  limpiarFormulario();
  formularioAbierto.value = true;
}

function cerrarFormulario() {
  if (guardando.value) {
    return;
  }

  formularioAbierto.value = false;
  error.value = '';
  limpiarFormulario();
}

function seleccionarArchivo(event) {
  formulario.value.archivo =
    event.target.files?.[0] || null;
}

async function verPdf(documento) {
  error.value = '';

  const ventana = window.open('', '_blank');

  if (!ventana) {
    error.value =
      'El navegador bloqueó la nueva pestaña. Permite ventanas emergentes.';
    return;
  }

  ventana.document.title = 'Cargando PDF...';
  ventana.document.body.textContent =
    'Cargando documento...';

  accionArchivo.value = `pdf-${documento.id}`;

  try {
    const blob = await api.getBlob(
      `/documentos/${documento.id}/versiones/${documento.version_id}/pdf`,
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

async function descargarOriginal(documento) {
  error.value = '';
  accionArchivo.value = `original-${documento.id}`;

  try {
    const blob = await api.getBlob(
      `/documentos/${documento.id}/versiones/${documento.version_id}/original`,
    );

    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download =
      documento.nombre_original || 'documento';
    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  } catch (err) {
    error.value =
      err.message || 'No se pudo descargar el original.';
  } finally {
    accionArchivo.value = '';
  }
}

async function guardarDocumento() {
  error.value = '';
  mensaje.value = '';

  if (!formulario.value.archivo) {
    error.value = 'Debes seleccionar un archivo.';
    return;
  }

  const datos = new FormData();

  datos.append('nombre', formulario.value.nombre);
  datos.append('tipo_documento_id', formulario.value.tipo_documento_id);
  datos.append('origen', formulario.value.origen);
  datos.append('version', formulario.value.version);
  datos.append('archivo', formulario.value.archivo);

  if (formulario.value.proceso_id) {
    datos.append(
      'proceso_id',
      formulario.value.proceso_id,
    );
  }

  guardando.value = true;

  try {
    const respuesta = await api.postForm(
      '/documentos',
      datos,
    );

    const documento = respuesta.documento;

    const tipo = tiposDocumento.value.find(
      (elemento) =>
        elemento.id ===
        Number(formulario.value.tipo_documento_id),
    );

    documentos.value.unshift({
      id: documento.id,
      codigo: documento.codigo || 'Pendiente',
      nombre: documento.nombre,
      tipo: tipo?.nombre || 'Sin tipo',
      version_id: documento.version_actual.id,
      nombre_original: documento.version_actual.nombre_original,
      estado_conversion: documento.version_actual.estado_conversion,
      version: documento.version_actual.version,
      origen: documento.origen,
      estado: documento.estado,
    });

    mensaje.value = respuesta.mensaje;
    formularioAbierto.value = false;
    limpiarFormulario();
  } catch (err) {
    error.value =
      err.message || 'No se pudo guardar el documento.';
  } finally {
    guardando.value = false;
  }
}

async function enviarRevision() {
  if (
    !documentoRevision.value ||
    enviandoRevision.value
  ) {
    return;
  }

  enviandoRevision.value = true;
  error.value = '';

  try {
    const respuesta = await api.post(
      `/documentos/${documentoRevision.value.id}` +
      `/versiones/${documentoRevision.value.version_id}` +
      '/enviar-revision',
      {
        responsable_id:
          formularioRevision.value.responsable_id || null,
        revisor_id:
          formularioRevision.value.revisor_id || null,
        aprobador_id:
          formularioRevision.value.aprobador_id,
        comentario:
          formularioRevision.value.comentario || null,
      },
    );

    revisionAbierta.value = false;
    documentoRevision.value = null;

    await cargarCatalogos();

    mensaje.value =
      respuesta.mensaje ||
      'El documento fue enviado a revisión.';
  } catch (err) {
    error.value =
      err.message ||
      'No se pudo enviar el documento a revisión.';
  } finally {
    enviandoRevision.value = false;
  }
}

async function cargarCatalogos() {
  cargandoCatalogos.value = true;
  error.value = '';

  try {
    const participantesPromesa = puedeIniciarFlujo.value
      ? api.get('/documentos/participantes')
      : Promise.resolve([]);

    const [
      tiposRespuesta,
      procesosRespuesta,
      documentosRespuesta,
      participantesRespuesta,
    ] = await Promise.all([
      api.get('/documentos/tipos'),
      api.get('/procesos'),
      api.get('/documentos'),
      participantesPromesa,
    ]);

    tiposDocumento.value = tiposRespuesta;
    procesos.value = procesosRespuesta;
    documentos.value = documentosRespuesta;
    participantes.value = participantesRespuesta;
  } catch (err) {
    error.value =
      err.message || 'No se pudieron cargar los catálogos.';
  } finally {
    cargandoCatalogos.value = false;
  }
}

onMounted(async () => {
  await cargarCatalogos();
});
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Documentos</h1>
        <p>Documentos controlados del sistema de calidad.</p>
      </div>
      <button class="btn btn-primary" type="button" :disabled="cargandoCatalogos" @click="abrirFormulario">
        <AppIcon name="plus" :size="16" />
        {{
          cargandoCatalogos
            ? 'Cargando...'
            : 'Alta de documento'
        }}
      </button>
    </div>

    <p v-if="mensaje" class="estado-mensaje estado-exito">
      {{ mensaje }}
    </p>

    <p v-if="error && !formularioAbierto" class="estado-mensaje estado-error">
      {{ error }}
    </p>

    <BaseCard>
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Versión</th>
            <th>Origen</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in documentos" :key="d.id">
            <td><code>{{ d.codigo }}</code></td>
            <td><strong>{{ d.nombre }}</strong></td>
            <td class="muted">{{ d.tipo }}</td>
            <td>v{{ d.version }}</td>
            <td class="muted">{{ d.origen }}</td>
            <td>
              <StatusBadge :estado="d.estado" />
            </td>
            <td>
              <div class="acciones-documento">
                <button class="btn btn-ghost btn-sm" type="button" :disabled="Boolean(accionArchivo) ||
                  !['completada', 'no_requerida'].includes(
                    d.estado_conversion,
                  )
                  " @click="verPdf(d)">
                  <AppIcon name="search" :size="14" />
                  {{
                    accionArchivo === `pdf-${d.id}`
                      ? 'Abriendo...'
                      : 'Ver PDF'
                  }}
                </button>

                <button class="btn btn-ghost btn-sm" type="button" :disabled="Boolean(accionArchivo)"
                  @click="descargarOriginal(d)">
                  <AppIcon name="doc" :size="14" />
                  {{
                    accionArchivo === `original-${d.id}`
                      ? 'Descargando...'
                      : 'Original'
                  }}
                </button>
                <button v-if="
                  puedeIniciarFlujo &&
                  d.estado === 'borrador' &&
                  d.solicitud_estado === 'correcciones'
                " class="btn btn-primary btn-sm" type="button" @click="abrirCorreccion(d)">
                  Subir corrección
                </button>

                <button v-if="
                  puedeIniciarFlujo &&
                  d.estado === 'borrador' &&
                  d.solicitud_estado !== 'correcciones'
                " class="btn btn-primary btn-sm" type="button" :disabled="Boolean(accionArchivo) ||
                  !['completada', 'no_requerida'].includes(
                    d.estado_conversion,
                  )
                  " @click="abrirRevision(d)">
                  Enviar a revisión
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
    <div v-if="formularioAbierto" class="overlay" @click.self="cerrarFormulario">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2>Alta de documento</h2>
            <p>Registra el original y genera su versión PDF.</p>
          </div>

          <button class="modal-close" type="button" :disabled="guardando" @click="cerrarFormulario">
            ✕
          </button>
        </div>

        <form class="modal-body" @submit.prevent="guardarDocumento">
          <label class="campo">
            <span>Nombre del documento *</span>
            <input v-model.trim="formulario.nombre" type="text" maxlength="200" required
              placeholder="Ej. Procedimiento de control documental" />
          </label>

          <div class="form-grid">
            <label class="campo">
              <span>Tipo de documento *</span>
              <select v-model="formulario.tipo_documento_id" required>
                <option value="">
                  Selecciona un tipo
                </option>
                <option v-for="tipo in tiposDocumento" :key="tipo.id" :value="tipo.id">
                  {{ tipo.nombre }}
                </option>
              </select>
            </label>

            <label class="campo">
              <span>Proceso relacionado</span>
              <select v-model="formulario.proceso_id">
                <option value="">
                  Sin proceso relacionado
                </option>
                <option v-for="proceso in procesos" :key="proceso.id" :value="proceso.id">
                  {{ proceso.nombre }}
                </option>
              </select>
            </label>
          </div>

          <div class="form-grid">
            <label class="campo">
              <span>Origen *</span>
              <select v-model="formulario.origen" required>
                <option value="interno">Interno</option>
                <option value="externo">Externo</option>
              </select>
            </label>

            <label class="campo">
              <span>Versión *</span>
              <input v-model.trim="formulario.version" type="text" maxlength="20" required placeholder="Ej. 1.0" />
            </label>
          </div>

          <label class="campo">
            <span>Archivo original *</span>
            <input ref="archivoInput" type="file" required
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" @change="seleccionarArchivo" />
            <small>
              PDF, Word, Excel, PowerPoint, PNG o JPEG.
              Máximo 25 MB.
            </small>
          </label>

          <p v-if="formulario.archivo" class="archivo-seleccionado">
            Seleccionado:
            <strong>{{ formulario.archivo.name }}</strong>
          </p>

          <p v-if="error" class="form-error">
            {{ error }}
          </p>

          <div class="modal-actions">
            <button class="btn btn-ghost" type="button" :disabled="guardando" @click="cerrarFormulario">
              Cancelar
            </button>

            <button class="btn btn-primary" type="submit" :disabled="guardando">
              {{
                guardando
                  ? 'Guardando...'
                  : 'Guardar documento'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="correccionAbierta" class="overlay" @click.self="cerrarCorreccion">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2>Subir archivo corregido</h2>
            <p>
              {{ documentoCorreccion?.codigo }} ·
              {{ documentoCorreccion?.nombre }}
            </p>
          </div>

          <button class="modal-close" type="button" :disabled="guardandoCorreccion" @click="cerrarCorreccion">
            ✕
          </button>
        </div>

        <form class="modal-body" @submit.prevent="guardarCorreccion">
          <label class="campo">
            <span>Archivo corregido *</span>

            <input ref="archivoCorreccionInput" type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg" required
              @change="seleccionarArchivoCorreccion" />
          </label>

          <p class="ayuda">
            El archivo reemplazará la versión borrador y se
            enviará nuevamente al flujo de revisión.
          </p>

          <p v-if="archivoCorreccion" class="archivo-seleccionado">
            Seleccionado:
            <strong>{{ archivoCorreccion.name }}</strong>
          </p>

          <p v-if="error" class="form-error">
            {{ error }}
          </p>

          <div class="modal-actions">
            <button class="btn btn-ghost" type="button" :disabled="guardandoCorreccion" @click="cerrarCorreccion">
              Cancelar
            </button>

            <button class="btn btn-primary" type="submit" :disabled="guardandoCorreccion">
              {{
                guardandoCorreccion
                  ? 'Guardando...'
                  : 'Guardar y reenviar'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
    <div v-if="revisionAbierta" class="overlay" @click.self="cerrarRevision">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2>Enviar documento a revisión</h2>
            <p>
              {{ documentoRevision?.codigo }} ·
              {{ documentoRevision?.nombre }}
            </p>
          </div>

          <button class="modal-close" type="button" :disabled="enviandoRevision" @click="cerrarRevision">
            ✕
          </button>
        </div>

        <form class="modal-body" @submit.prevent="enviarRevision">
          <label class="campo">
            <span>Responsable del documento</span>

            <select v-model="formularioRevision.responsable_id">
              <option value="">
                Sin responsable adicional
              </option>

              <option v-for="usuario in responsables" :key="usuario.id" :value="usuario.id">
                {{ usuario.nombre }} · {{ usuario.correo }}
              </option>
            </select>
          </label>

          <label class="campo">
            <span>Revisor</span>

            <select v-model="formularioRevision.revisor_id">
              <option value="">
                Sin revisión intermedia
              </option>

              <option v-for="usuario in revisores" :key="usuario.id" :value="usuario.id">
                {{ usuario.nombre }} · {{ usuario.correo }}
              </option>
            </select>
          </label>

          <label class="campo">
            <span>Aprobador *</span>

            <select v-model="formularioRevision.aprobador_id" required>
              <option value="">
                Selecciona un aprobador
              </option>

              <option v-for="usuario in aprobadores" :key="usuario.id" :value="usuario.id">
                {{ usuario.nombre }} · {{ usuario.correo }}
              </option>
            </select>
          </label>

          <label class="campo">
            <span>Comentario para el flujo</span>

            <textarea v-model.trim="formularioRevision.comentario" rows="4" maxlength="2000"
              placeholder="Explica brevemente qué debe revisarse..."></textarea>
          </label>

          <p v-if="error" class="form-error">
            {{ error }}
          </p>

          <div class="modal-actions">
            <button class="btn btn-ghost" type="button" :disabled="enviandoRevision" @click="cerrarRevision">
              Cancelar
            </button>

            <button class="btn btn-primary" type="submit" :disabled="enviandoRevision">
              {{
                enviandoRevision
                  ? 'Enviando...'
                  : 'Enviar a revisión'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
code {
  background: var(--gray-100);
  padding: 2px 7px;
  border-radius: 5px;
  font-size: 12px;
  color: var(--brand-800);
  font-weight: 600;
  white-space: nowrap;
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

.estado-error,
.form-error {
  color: var(--danger);
  background: var(--danger-bg);
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
  max-width: 680px;
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

.modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.modal-body {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 22px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
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
.campo select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--gray-900);
  background: #fff;
  font: inherit;
  font-size: 14px;
  font-weight: 400;
  outline: none;
}

.campo input:focus,
.campo select:focus {
  border-color: var(--brand-500);
  box-shadow: 0 0 0 3px var(--brand-100);
}

.campo input[type='file'] {
  padding: 8px;
}

.campo small {
  color: var(--gray-500);
  font-size: 11px;
  font-weight: 400;
}

.archivo-seleccionado {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--brand-700);
  background: var(--brand-100);
  font-size: 13px;
  overflow-wrap: anywhere;
}

.form-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 3px;
}

.acciones-documento {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.acciones-documento .btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

@media (max-width: 600px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .overlay {
    padding: 20px 10px;
  }
}
</style>
