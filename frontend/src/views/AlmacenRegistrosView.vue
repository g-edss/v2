<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api/client.js';
import { useAuthStore } from '@/stores/auth.js';
import AppIcon from '@/components/AppIcon.vue';
import BaseCard from '@/components/BaseCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';

const auth = useAuthStore();
const registros = ref([]);
const cargando = ref(false);
const error = ref('');
const procesos = ref([]);
const responsables = ref([]);
const revisores = ref([]);
const aprobadores = ref([]);
const formularioAbierto = ref(false);
const cargandoCatalogos = ref(false);
const guardando = ref(false);
const descargandoId = ref(null);
const mensaje = ref('');
const archivoInput = ref(null);
const revisionAbierta = ref(false);
const registroRevision = ref(null);
const enviandoRevision = ref(false);
const formularioRevision = ref({
  revisor_id: '',
  aprobador_id: '',
  comentario: ''
});
const formulario = ref({
  nombre: '',
  proceso_id: '',
  responsable_id: '',
  fecha_registro: '',
  descripcion: '',
  archivo: null
});
const puedeCrear = computed(() =>
  ['admin_general', 'responsable'].includes(
    auth.usuario?.rol_clave
  )
);

function obtenerFechaActual() {
  const fecha = new Date();

  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
}

function limpiarFormulario() {
  formulario.value = {
    nombre: '',
    proceso_id: '',
    responsable_id: '',
    fecha_registro: obtenerFechaActual(),
    descripcion: '',
    archivo: null
  };

  if (archivoInput.value) {
    archivoInput.value.value = '';
  }
}

async function abrirFormulario() {
  error.value = '';
  mensaje.value = '';
  limpiarFormulario();
  formularioAbierto.value = true;
  cargandoCatalogos.value = true;

  try {
    const [
      procesosRespuesta,
      participantesRespuesta
    ] = await Promise.all([
      api.get('/procesos'),
      api.get('/documentos/participantes')
    ]);

    procesos.value = procesosRespuesta;

    responsables.value = participantesRespuesta.filter(
      (usuario) => usuario.rol_clave === 'responsable'
    );
    revisores.value = participantesRespuesta.filter(
      (usuario) => usuario.rol_clave === 'revisor'
    );

    aprobadores.value = participantesRespuesta.filter(
      (usuario) => usuario.rol_clave === 'aprobador'
    );
  } catch (err) {
    error.value =
      err.message || 'No se pudieron cargar los catálogos.';
    formularioAbierto.value = false;
  } finally {
    cargandoCatalogos.value = false;
  }
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

async function abrirRevision(registro) {
  error.value = '';
  mensaje.value = '';

  formularioRevision.value = {
    revisor_id: '',
    aprobador_id: '',
    comentario: ''
  };

  registroRevision.value = registro;
  revisionAbierta.value = true;
  cargandoCatalogos.value = true;

  try {
    const participantes = await api.get(
      '/documentos/participantes'
    );

    revisores.value = participantes.filter(
      (usuario) => usuario.rol_clave === 'revisor'
    );

    aprobadores.value = participantes.filter(
      (usuario) => usuario.rol_clave === 'aprobador'
    );
  } catch (err) {
    error.value =
      err.message || 'No se pudieron cargar los participantes.';
    revisionAbierta.value = false;
    registroRevision.value = null;
  } finally {
    cargandoCatalogos.value = false;
  }
}

function cerrarRevision() {
  if (enviandoRevision.value) {
    return;
  }

  revisionAbierta.value = false;
  registroRevision.value = null;
  error.value = '';
}

async function enviarRegistroRevision() {
  error.value = '';
  mensaje.value = '';

  if (
    !registroRevision.value ||
    !formularioRevision.value.aprobador_id
  ) {
    error.value = 'Debes seleccionar un aprobador.';
    return;
  }

  enviandoRevision.value = true;
  let enviado = false;

  try {
    const respuesta = await api.post(
      `/registros/${registroRevision.value.id}/enviar-revision`,
      {
        revisor_id:
          formularioRevision.value.revisor_id || null,
        aprobador_id:
          formularioRevision.value.aprobador_id,
        comentario:
          formularioRevision.value.comentario.trim()
      }
    );

    mensaje.value = respuesta.mensaje;
    enviado = true;

    await cargarRegistros();
  } catch (err) {
    error.value =
      err.message || 'No se pudo enviar el registro.';
  } finally {
    enviandoRevision.value = false;
  }

  if (enviado) {
    revisionAbierta.value = false;
    registroRevision.value = null;
  }
}

async function guardarRegistro() {
  error.value = '';
  mensaje.value = '';

  if (
    !formulario.value.nombre.trim() ||
    !formulario.value.proceso_id ||
    !formulario.value.responsable_id ||
    !formulario.value.fecha_registro ||
    !formulario.value.archivo
  ) {
    error.value =
      'Completa los campos obligatorios y selecciona un archivo.';
    return;
  }

  const datos = new FormData();

  datos.append(
    'nombre',
    formulario.value.nombre.trim()
  );

  datos.append(
    'proceso_id',
    formulario.value.proceso_id
  );

  datos.append(
    'responsable_id',
    formulario.value.responsable_id
  );

  datos.append(
    'fecha_registro',
    formulario.value.fecha_registro
  );

  datos.append(
    'descripcion',
    formulario.value.descripcion.trim()
  );

  datos.append(
    'archivo',
    formulario.value.archivo
  );

  guardando.value = true;
  let guardado = false;

  try {
    const respuesta = await api.postForm(
      '/registros',
      datos
    );

    mensaje.value = respuesta.mensaje;
    guardado = true;

    await cargarRegistros();
  } catch (err) {
    error.value =
      err.message || 'No se pudo guardar el registro.';
  } finally {
    guardando.value = false;
  }

  if (guardado) {
    formularioAbierto.value = false;
    limpiarFormulario();
  }
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

async function descargarArchivo(registro) {
  error.value = '';
  descargandoId.value = registro.id;

  try {
    const archivo = await api.getBlob(
      `/registros/${registro.id}/archivo`
    );

    const url = URL.createObjectURL(archivo);
    const enlace = document.createElement('a');

    enlace.href = url;
    enlace.download =
      registro.nombre_archivo || 'registro';

    document.body.appendChild(enlace);
    enlace.click();
    enlace.remove();

    URL.revokeObjectURL(url);
  } catch (err) {
    error.value =
      err.message || 'No se pudo descargar el archivo.';
  } finally {
    descargandoId.value = null;
  }
}

async function cargarRegistros() {
  cargando.value = true;
  error.value = '';

  try {
    registros.value = await api.get('/registros');
  } catch (err) {
    error.value =
      err.message || 'No se pudieron cargar los registros.';
  } finally {
    cargando.value = false;
  }
}

onMounted(cargarRegistros);
</script>

<template>
  <div class="stack">
    <div class="page-head">
      <div>
        <h1>Almacén de registros</h1>
        <p>
          Consulta los registros generados por los procesos
          de calidad.
        </p>
      </div>

      <button v-if="puedeCrear" type="button" class="btn btn-primary" @click="abrirFormulario">
        <AppIcon name="plus" :size="16" />
        Nuevo registro
      </button>
    </div>

    <p v-if="mensaje" class="estado-mensaje estado-exito">
      {{ mensaje }}
    </p>

    <p v-if="
      error &&
      !formularioAbierto &&
      !revisionAbierta
    " class="estado-mensaje estado-error">
      {{ error }}
    </p>

    <BaseCard>
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Proceso</th>
            <th>Responsable</th>
            <th>Fecha</th>
            <th>Archivo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="cargando">
            <td colspan="7" class="table-message">
              Cargando registros...
            </td>
          </tr>

          <tr v-else-if="registros.length === 0">
            <td colspan="7" class="table-message">
              No hay registros disponibles.
            </td>
          </tr>

          <tr v-for="registro in registros" v-else :key="registro.id">
            <td>
              <strong>{{ registro.nombre }}</strong>
            </td>
            <td>{{ registro.proceso }}</td>
            <td>
              <div>{{ registro.responsable }}</div>
              <small class="muted">
                {{ registro.responsable_correo }}
              </small>
            </td>
            <td>
              {{ formatearFecha(registro.fecha_registro) }}
            </td>
            <td>
              <button v-if="registro.nombre_archivo" type="button" class="btn btn-ghost btn-archivo"
                :disabled="descargandoId === registro.id" @click="descargarArchivo(registro)">
                <AppIcon name="doc" :size="15" />

                {{
                  descargandoId === registro.id
                    ? 'Descargando...'
                    : registro.nombre_archivo
                }}
              </button>

              <span v-else>—</span>
            </td>
            <td>
              <StatusBadge :estado="registro.estado" />
            </td>
            <td>
              <button v-if="
                puedeCrear &&
                registro.estado === 'borrador'
              " type="button" class="btn btn-primary" @click="abrirRevision(registro)">
                Enviar a aprobación
              </button>

              <span v-else>—</span>
            </td>
          </tr>
        </tbody>
      </table>
    </BaseCard>
    <div v-if="formularioAbierto" class="overlay" @click.self="cerrarFormulario">
      <div class="modal">
        <div class="modal-head">
          <div>
            <h2>Nuevo registro</h2>
            <p>
              Captura un registro generado por un proceso
              de calidad.
            </p>
          </div>

          <button type="button" class="modal-close" :disabled="guardando" @click="cerrarFormulario">
            ✕
          </button>
        </div>

        <form class="modal-body" @submit.prevent="guardarRegistro">
          <label class="campo">
            <span>Nombre del registro *</span>
            <input v-model.trim="formulario.nombre" type="text" maxlength="255" required
              placeholder="Ej. Bitácora mensual de mantenimiento" />
          </label>

          <div class="form-grid">
            <label class="campo">
              <span>Proceso *</span>
              <select v-model="formulario.proceso_id" :disabled="cargandoCatalogos" required>
                <option value="">
                  Selecciona un proceso
                </option>

                <option v-for="proceso in procesos" :key="proceso.id" :value="proceso.id">
                  {{ proceso.nombre }}
                </option>
              </select>
            </label>

            <label class="campo">
              <span>Responsable *</span>
              <select v-model="formulario.responsable_id" :disabled="cargandoCatalogos" required>
                <option value="">
                  Selecciona un responsable
                </option>

                <option v-for="responsable in responsables" :key="responsable.id" :value="responsable.id">
                  {{ responsable.nombre }}
                </option>
              </select>
            </label>
          </div>

          <label class="campo">
            <span>Fecha de registro *</span>
            <input v-model="formulario.fecha_registro" type="date" required />
          </label>

          <label class="campo">
            <span>Descripción</span>
            <textarea v-model="formulario.descripcion" maxlength="2000" rows="4"
              placeholder="Describe brevemente el contenido del registro..."></textarea>
          </label>

          <label class="campo">
            <span>Archivo o evidencia *</span>
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
            <button type="button" class="btn btn-ghost" :disabled="guardando" @click="cerrarFormulario">
              Cancelar
            </button>

            <button type="submit" class="btn btn-primary" :disabled="guardando || cargandoCatalogos">
              {{
                guardando
                  ? 'Guardando...'
                  : 'Guardar registro'
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
            <h2>Enviar registro a aprobación</h2>
            <p>
              {{ registroRevision?.nombre }}
            </p>
          </div>

          <button type="button" class="modal-close" :disabled="enviandoRevision" @click="cerrarRevision">
            ✕
          </button>
        </div>

        <form class="modal-body" @submit.prevent="enviarRegistroRevision">
          <p class="revision-info">
            El responsable del registro atenderá la primera
            etapa del flujo.
          </p>

          <label class="campo">
            <span>Revisor</span>

            <select v-model="formularioRevision.revisor_id" :disabled="cargandoCatalogos">
              <option value="">
                Sin revisor
              </option>

              <option v-for="revisor in revisores" :key="revisor.id" :value="revisor.id">
                {{ revisor.nombre }} · {{ revisor.correo }}
              </option>
            </select>

            <small>
              Esta etapa es opcional.
            </small>
          </label>

          <label class="campo">
            <span>Aprobador *</span>

            <select v-model="formularioRevision.aprobador_id" :disabled="cargandoCatalogos" required>
              <option value="">
                Selecciona un aprobador
              </option>

              <option v-for="aprobador in aprobadores" :key="aprobador.id" :value="aprobador.id">
                {{ aprobador.nombre }} · {{ aprobador.correo }}
              </option>
            </select>
          </label>

          <label class="campo">
            <span>Comentario</span>

            <textarea v-model="formularioRevision.comentario" maxlength="2000" rows="4"
              placeholder="Agrega indicaciones para quienes revisarán el registro..."></textarea>
          </label>

          <p v-if="error" class="form-error">
            {{ error }}
          </p>

          <div class="modal-actions">
            <button type="button" class="btn btn-ghost" :disabled="enviandoRevision" @click="cerrarRevision">
              Cancelar
            </button>

            <button type="submit" class="btn btn-primary" :disabled="enviandoRevision ||
              cargandoCatalogos
              ">
              {{
                enviandoRevision
                  ? 'Enviando...'
                  : 'Enviar a aprobación'
              }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

.estado-error {
  color: var(--danger);
  background: var(--danger-bg);
}

.table-message {
  padding: 32px 16px;
  color: var(--gray-500);
  text-align: center;
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
.campo select,
.campo textarea {
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

.campo textarea {
  resize: vertical;
  min-height: 90px;
}

.campo input:focus,
.campo select:focus,
.campo textarea:focus {
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

.archivo-seleccionado,
.form-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 12px;
}

.archivo-seleccionado {
  color: var(--brand-800);
  background: var(--brand-100);
}

.form-error {
  color: var(--danger);
  background: var(--danger-bg);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding-top: 2px;
}

.btn-archivo {
  max-width: 260px;
  justify-content: flex-start;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.revision-info {
  margin: 0;
  padding: 10px 12px;
  border-radius: 8px;
  color: var(--brand-800);
  background: var(--brand-100);
  font-size: 12px;
}

@media (max-width: 700px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .overlay {
    padding: 20px 10px;
  }

  .modal-actions {
    flex-direction: column-reverse;
  }

  .modal-actions .btn {
    justify-content: center;
    width: 100%;
  }
}
</style>