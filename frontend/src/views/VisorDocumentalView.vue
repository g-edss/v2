<script setup>
import { computed, onMounted, ref } from 'vue';
import { api } from '@/api/client.js';
import AppIcon from '@/components/AppIcon.vue';

const documentos = ref([]);
const cargando = ref(false);
const error = ref('');
const accionArchivo = ref('');
const busqueda = ref('');
const procesoSeleccionado = ref('');
const tipoSeleccionado = ref('');

const procesosDisponibles = computed(() => {
    const procesosUnicos = new Map();

    documentos.value.forEach((documento) => {
        if (documento.proceso_id && documento.proceso) {
            procesosUnicos.set(
                String(documento.proceso_id),
                {
                    id: String(documento.proceso_id),
                    nombre: documento.proceso
                }
            );
        }
    });

    return Array.from(procesosUnicos.values())
        .sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es')
        );
});

const tiposDisponibles = computed(() => {
    if (!procesoSeleccionado.value) {
        return [];
    }

    const tiposUnicos = new Map();

    documentos.value
        .filter(
            (documento) =>
                String(documento.proceso_id) ===
                procesoSeleccionado.value
        )
        .forEach((documento) => {
            tiposUnicos.set(
                String(documento.tipo_documento_id),
                {
                    id: String(documento.tipo_documento_id),
                    nombre: documento.tipo
                }
            );
        });

    return Array.from(tiposUnicos.values())
        .sort((a, b) =>
            a.nombre.localeCompare(b.nombre, 'es')
        );
});

function seleccionarProceso(procesoId) {
    procesoSeleccionado.value = String(procesoId);
    tipoSeleccionado.value = '';
}

function seleccionarTipo(tipoId) {
    tipoSeleccionado.value = String(tipoId);
}

function normalizarTexto(valor) {
    return String(valor || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

const documentosFiltrados = computed(() => {
    const texto = normalizarTexto(busqueda.value);

    return documentos.value.filter((documento) => {
        const coincideProceso =
            !procesoSeleccionado.value ||
            String(documento.proceso_id) ===
            procesoSeleccionado.value;

        const coincideTipo =
            !tipoSeleccionado.value ||
            String(documento.tipo_documento_id) ===
            tipoSeleccionado.value;

        const contenidoDocumento = normalizarTexto([
            documento.codigo,
            documento.nombre,
            documento.proceso,
            documento.tipo,
            documento.origen
        ].join(' '));

        const coincideBusqueda =
            !texto ||
            contenidoDocumento.includes(texto);

        return (
            coincideProceso &&
            coincideTipo &&
            coincideBusqueda
        );
    });
});

const documentosVisibles = computed(() => {
    const hayBusqueda = normalizarTexto(busqueda.value);

    if (
        !hayBusqueda &&
        (
            !procesoSeleccionado.value ||
            !tipoSeleccionado.value
        )
    ) {
        return [];
    }

    return documentosFiltrados.value;
});

async function cargarDocumentos() {
    cargando.value = true;
    error.value = '';

    try {
        documentos.value =
            await api.get('/documentos/visor');
    } catch (err) {
        error.value =
            err.message || 'No se pudo cargar el visor documental.';
    } finally {
        cargando.value = false;
    }
}

async function verPdf(documento) {
    error.value = '';

    const ventana = window.open('', '_blank');

    if (!ventana) {
        error.value =
            'El navegador bloqueó la nueva pestaña.';
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

onMounted(cargarDocumentos);
</script>

<template>
    <div class="stack">
        <div class="page-head">
            <div>
                <h1>Visor Documental</h1>
                <p>Consulta los documentos vigentes del sistema de calidad.</p>
            </div>
        </div>

        <div class="buscador-documental">
            <AppIcon name="search" :size="18" />

            <input v-model="busqueda" type="search" placeholder="Buscar por código o nombre del documento" />
        </div>

        <div class="navegador-documental">
            <section class="panel-documental">
                <h2>Proceso</h2>

                <div class="lista-opciones">
                    <button v-for="proceso in procesosDisponibles" :key="proceso.id" class="opcion-navegacion" :class="{
                        activa:
                            procesoSeleccionado === proceso.id
                    }" type="button" @click="seleccionarProceso(proceso.id)">
                        <span>{{ proceso.nombre }}</span>
                        <span aria-hidden="true">›</span>
                    </button>
                </div>
            </section>

            <section class="panel-documental">
                <h2>Tipo de documento</h2>

                <p v-if="!procesoSeleccionado" class="mensaje-panel">
                    Selecciona primero un proceso.
                </p>

                <p v-else-if="tiposDisponibles.length === 0" class="mensaje-panel">
                    Este proceso no tiene tipos disponibles.
                </p>

                <div v-else class="lista-opciones">
                    <button v-for="tipo in tiposDisponibles" :key="tipo.id" class="opcion-navegacion" :class="{
                        activa:
                            tipoSeleccionado === tipo.id
                    }" type="button" @click="seleccionarTipo(tipo.id)">
                        <span>{{ tipo.nombre }}</span>
                        <span aria-hidden="true">›</span>
                    </button>
                </div>
            </section>

            <section class="panel-documental panel-documentos">
                <h2>Documento</h2>

                <p v-if="cargando" class="mensaje-panel">
                    Cargando documentos vigentes...
                </p>

                <p v-else-if="error" class="mensaje-panel mensaje-error">
                    {{ error }}
                </p>

                <p v-else-if="
                    !busqueda &&
                    (
                        !procesoSeleccionado ||
                        !tipoSeleccionado
                    )
                " class="mensaje-panel">
                    Selecciona un proceso y un tipo de documento.
                </p>

                <p v-else-if="documentosVisibles.length === 0" class="mensaje-panel">
                    No hay documentos que coincidan con la selección.
                </p>

                <div v-else class="lista-documentos">
                    <article v-for="documento in documentosVisibles" :key="documento.id" class="documento-item">
                        <div class="informacion-documento">
                            <code>
                        {{ documento.codigo || 'Sin código' }}
                    </code>

                            <strong>{{ documento.nombre }}</strong>

                            <span>
                                {{ documento.tipo }} ·
                                v{{ documento.version }}
                            </span>
                        </div>

                        <div class="acciones-documento">
                            <button class="btn btn-ghost btn-sm" type="button" :disabled="Boolean(accionArchivo)"
                                @click="verPdf(documento)">
                                <AppIcon name="search" :size="14" />

                                {{
                                    accionArchivo ===
                                        `pdf-${documento.id}`
                                        ? 'Abriendo...'
                                        : 'Ver PDF'
                                }}
                            </button>

                            <button class="btn btn-ghost btn-sm" type="button" :disabled="Boolean(accionArchivo)"
                                @click="descargarOriginal(documento)">
                                <AppIcon name="doc" :size="14" />

                                {{
                                    accionArchivo ===
                                        `original-${documento.id}`
                                        ? 'Descargando...'
                                        : 'Original'
                                }}
                            </button>
                        </div>
                    </article>
                </div>
            </section>
        </div>
    </div>
</template>

<style scoped>
.buscador-documental {
    display: flex;
    align-items: center;
    gap: 10px;
    max-width: 520px;
    padding: 0 14px;
    border: 1px solid var(--gray-300);
    border-radius: 8px;
    background: white;
    color: var(--gray-500);
}

.buscador-documental:focus-within {
    border-color: var(--brand-500);
    box-shadow: 0 0 0 3px var(--brand-100);
}

.buscador-documental input {
    width: 100%;
    min-height: 44px;
    border: 0;
    background: transparent;
    color: var(--gray-900);
    font: inherit;
    outline: none;
}

.navegador-documental {
    display: grid;
    grid-template-columns:
        minmax(210px, 0.9fr) minmax(210px, 0.9fr) minmax(360px, 2fr);
    gap: 18px;
    align-items: start;
}

.panel-documental {
    min-width: 0;
    min-height: 320px;
    overflow: hidden;
    border: 1px solid var(--gray-200);
    border-radius: 10px;
    background: white;
    box-shadow: 0 2px 8px rgb(15 23 42 / 5%);
}

.panel-documental h2 {
    margin: 0;
    padding: 16px 18px;
    border-bottom: 1px solid var(--gray-200);
    color: var(--gray-900);
    font-size: 14px;
    font-weight: 700;
}

.lista-opciones,
.lista-documentos {
    display: grid;
    max-height: 430px;
    overflow-y: auto;
}

.opcion-navegacion {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    padding: 13px 18px;
    border: 0;
    border-bottom: 1px solid var(--gray-100);
    background: white;
    color: var(--gray-700);
    font: inherit;
    text-align: left;
    cursor: pointer;
}

.opcion-navegacion:hover {
    background: var(--gray-100);
    color: var(--brand-700);
}

.opcion-navegacion.activa {
    background: var(--brand-50);
    color: var(--brand-700);
    font-weight: 700;
}

.mensaje-panel {
    margin: 0;
    padding: 24px 18px;
    color: var(--gray-500);
    font-size: 13px;
    line-height: 1.5;
    text-align: center;
}

.mensaje-error {
    color: var(--danger);
    background: var(--danger-bg);
}

.documento-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 16px 18px;
    border-bottom: 1px solid var(--gray-200);
}

.documento-item:last-child {
    border-bottom: 0;
}

.informacion-documento {
    display: grid;
    gap: 6px;
    min-width: 0;
}

.informacion-documento code {
    width: fit-content;
    padding: 2px 7px;
    border-radius: 5px;
    background: var(--gray-100);
    color: var(--brand-800);
    font-size: 12px;
    font-weight: 700;
}

.informacion-documento strong {
    color: var(--gray-900);
    overflow-wrap: anywhere;
}

.informacion-documento span {
    color: var(--gray-500);
    font-size: 12px;
}

.acciones-documento {
    display: flex;
    flex-shrink: 0;
    flex-wrap: wrap;
    gap: 7px;
}

.acciones-documento .btn:disabled {
    cursor: not-allowed;
    opacity: 0.5;
}

@media (max-width: 1050px) {
    .navegador-documental {
        grid-template-columns: 1fr 1fr;
    }

    .panel-documentos {
        grid-column: 1 / -1;
    }
}

@media (max-width: 700px) {
    .navegador-documental {
        grid-template-columns: 1fr;
    }

    .panel-documentos {
        grid-column: auto;
    }

    .panel-documental {
        min-height: auto;
    }

    .documento-item {
        align-items: flex-start;
        flex-direction: column;
    }
}
</style>