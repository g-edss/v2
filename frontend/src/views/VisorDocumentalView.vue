<script setup>
import { onMounted, ref } from 'vue';

import { api } from '@/api/client.js';
import AppIcon from '@/components/AppIcon.vue';
import BaseCard from '@/components/BaseCard.vue';
import StatusBadge from '@/components/StatusBadge.vue';

const documentos = ref([]);
const cargando = ref(false);
const error = ref('');
const accionArchivo = ref('');

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
                    <tr v-if="cargando">
                        <td colspan="7" class="estado-tabla">
                            Cargando documentos vigentes...
                        </td>
                    </tr>

                    <tr v-else-if="error">
                        <td colspan="7" class="estado-tabla estado-error">
                            {{ error }}
                        </td>
                    </tr>

                    <tr v-else-if="documentos.length === 0">
                        <td colspan="7" class="estado-tabla">
                            No hay documentos vigentes disponibles.
                        </td>
                    </tr>

                    <template v-else>
                        <tr v-for="documento in documentos" :key="documento.id">
                            <td><code>{{ documento.codigo }}</code></td>
                            <td><strong>{{ documento.nombre }}</strong></td>
                            <td class="muted">{{ documento.tipo }}</td>
                            <td>v{{ documento.version }}</td>
                            <td class="muted">{{ documento.origen }}</td>
                            <td>
                                <StatusBadge :estado="documento.estado" />
                            </td>
                            <td>
                                <div class="acciones-documento">
                                    <button class="btn btn-ghost btn-sm" type="button"
                                        :disabled="Boolean(accionArchivo)" @click="verPdf(documento)">
                                        <AppIcon name="search" :size="14" />
                                        {{
                                            accionArchivo === `pdf-${documento.id}`
                                                ? 'Abriendo...'
                                                : 'Ver PDF'
                                        }}
                                    </button>

                                    <button class="btn btn-ghost btn-sm" type="button"
                                        :disabled="Boolean(accionArchivo)" @click="descargarOriginal(documento)">
                                        <AppIcon name="doc" :size="14" />
                                        {{
                                            accionArchivo ===
                                                `original-${documento.id}`
                                                ? 'Descargando...'
                                                : 'Original'
                                        }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </template>
                </tbody>
            </table>
        </BaseCard>
    </div>
</template>

<style scoped>
code {
    padding: 2px 7px;
    border-radius: 5px;
    background: var(--gray-100);
    color: var(--brand-800);
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
}

.estado-tabla {
    padding: 26px !important;
    color: var(--gray-500);
    text-align: center;
}

.estado-error {
    color: var(--danger);
    background: var(--danger-bg);
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
</style>