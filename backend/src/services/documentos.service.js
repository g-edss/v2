import { createHash, randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { pool } from '../config/db.js';

const DIRECTORIO_RAIZ = process.env.STORAGE_DIR || '/app/storage';
const DIRECTORIO_ORIGINALES = path.join(DIRECTORIO_RAIZ, 'originales');
const DIRECTORIO_PDF = path.join(DIRECTORIO_RAIZ, 'pdf');

const EXTENSIONES_OFFICE = new Set([
    '.doc',
    '.docx',
    '.xls',
    '.xlsx',
    '.ppt',
    '.pptx',
]);

const EXTENSIONES_IMAGEN = new Set([
    '.png',
    '.jpg',
    '.jpeg',
]);

function crearError(mensaje, status = 500) {
    const error = new Error(mensaje);
    error.status = status;
    error.publico = mensaje;
    return error;
}

async function validarParticipante(
    client,
    usuarioId,
    rolEsperado,
    obligatorio = false,
) {
    if (usuarioId === null || usuarioId === undefined) {
        if (obligatorio) {
            throw crearError(
                `Debes seleccionar un ${rolEsperado}.`,
                400,
            );
        }

        return null;
    }

    const { rows } = await client.query(
        `SELECT u.id
     FROM usuarios u
     JOIN roles r
       ON r.id = u.rol_id
     WHERE u.id = $1
       AND u.activo = TRUE
       AND r.clave = $2`,
        [usuarioId, rolEsperado],
    );

    if (!rows[0]) {
        throw crearError(
            `El usuario seleccionado no es un ${rolEsperado} activo.`,
            400,
        );
    }

    return rows[0].id;
}

async function prepararDirectorios() {
    await Promise.all([
        mkdir(DIRECTORIO_ORIGINALES, { recursive: true }),
        mkdir(DIRECTORIO_PDF, { recursive: true }),
    ]);
}

function calcularHash(buffer) {
    return createHash('sha256').update(buffer).digest('hex');
}

function crearNombreSeguro(extension) {
    return `${randomUUID()}${extension}`;
}

function resolverRutaSegura(rutaRelativa) {
    const raizAbsoluta = path.resolve(DIRECTORIO_RAIZ);
    const rutaAbsoluta = path.resolve(
        DIRECTORIO_RAIZ,
        rutaRelativa,
    );

    if (
        rutaAbsoluta !== raizAbsoluta &&
        !rutaAbsoluta.startsWith(`${raizAbsoluta}${path.sep}`)
    ) {
        throw crearError('La ruta del archivo no es válida.', 400);
    }

    return rutaAbsoluta;
}

async function convertirOfficeAPdf(archivo) {
    const gotenbergUrl = process.env.GOTENBERG_URL;

    if (!gotenbergUrl) {
        throw crearError(
            'El servicio de conversión de documentos no está configurado.',
            503,
        );
    }

    const formulario = new FormData();

    formulario.append(
        'files',
        new Blob([archivo.buffer], { type: archivo.mimetype }),
        archivo.originalname,
    );

    let respuesta;

    try {
        respuesta = await fetch(
            `${gotenbergUrl}/forms/libreoffice/convert`,
            {
                method: 'POST',
                body: formulario,
                signal: AbortSignal.timeout(120000),
            },
        );
    } catch (error) {
        console.error('No fue posible comunicarse con Gotenberg:', error);
        throw crearError(
            'El servicio de conversión no está disponible.',
            503,
        );
    }

    if (!respuesta.ok) {
        const detalle = await respuesta.text();

        console.error(
            `Gotenberg respondió ${respuesta.status}: ${detalle}`,
        );

        throw crearError(
            'No se pudo convertir el documento a PDF.',
            422,
        );
    }

    return Buffer.from(await respuesta.arrayBuffer());
}

async function convertirImagenAPdf(archivo, extension) {
    const gotenbergUrl = process.env.GOTENBERG_URL;

    if (!gotenbergUrl) {
        throw crearError(
            'El servicio de conversión de documentos no está configurado.',
            503,
        );
    }

    const nombreImagen = `imagen${extension}`;

    const html = `
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }

          html,
          body {
            height: 100%;
            margin: 0;
          }

          body {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        </style>
      </head>
      <body>
        <img src="${nombreImagen}" alt="Documento convertido">
      </body>
    </html>
  `;

    const formulario = new FormData();

    formulario.append(
        'files',
        new Blob([html], { type: 'text/html' }),
        'index.html',
    );

    formulario.append(
        'files',
        new Blob([archivo.buffer], { type: archivo.mimetype }),
        nombreImagen,
    );

    let respuesta;

    try {
        respuesta = await fetch(
            `${gotenbergUrl}/forms/chromium/convert/html`,
            {
                method: 'POST',
                body: formulario,
                signal: AbortSignal.timeout(120000),
            },
        );
    } catch (error) {
        console.error('No fue posible comunicarse con Gotenberg:', error);
        throw crearError(
            'El servicio de conversión no está disponible.',
            503,
        );
    }

    if (!respuesta.ok) {
        const detalle = await respuesta.text();

        console.error(
            `Gotenberg respondió ${respuesta.status}: ${detalle}`,
        );

        throw crearError(
            'No se pudo convertir la imagen a PDF.',
            422,
        );
    }

    return Buffer.from(await respuesta.arrayBuffer());
}

export async function guardarArchivoDocumento(archivo) {
    if (!archivo?.buffer) {
        throw crearError('Debes seleccionar un archivo.', 400);
    }

    const extension = path.extname(archivo.originalname).toLowerCase();

    const esPdf = extension === '.pdf';
    const esOffice = EXTENSIONES_OFFICE.has(extension);
    const esImagen = EXTENSIONES_IMAGEN.has(extension);

    if (!esPdf && !esOffice && !esImagen) {
        throw crearError('El formato del archivo no está permitido.', 400);
    }

    await prepararDirectorios();

    const nombreOriginalSeguro = crearNombreSeguro(extension);
    const identificador = path.parse(nombreOriginalSeguro).name;
    const nombrePdf = `${identificador}.pdf`;

    const rutaOriginalRelativa = path.posix.join(
        'originales',
        nombreOriginalSeguro,
    );

    const rutaPdfRelativa = esPdf
        ? rutaOriginalRelativa
        : path.posix.join('pdf', nombrePdf);

    const rutaOriginalAbsoluta = path.join(
        DIRECTORIO_RAIZ,
        rutaOriginalRelativa,
    );

    await writeFile(rutaOriginalAbsoluta, archivo.buffer);

    let estadoConversion = 'no_requerida';
    let errorConversion = null;

    if (!esPdf) {
        try {
            const pdfBuffer = esOffice
                ? await convertirOfficeAPdf(archivo)
                : await convertirImagenAPdf(archivo, extension);

            await writeFile(
                path.join(DIRECTORIO_RAIZ, rutaPdfRelativa),
                pdfBuffer,
            );

            estadoConversion = 'completada';
        } catch (error) {
            estadoConversion = 'error';
            errorConversion =
                error.publico || 'No se pudo generar el archivo PDF.';
        }
    }

    return {
        archivoOriginalUrl: rutaOriginalRelativa,
        archivoPdfUrl:
            estadoConversion === 'error' ? null : rutaPdfRelativa,
        nombreOriginal: path.basename(archivo.originalname),
        tipoMime: archivo.mimetype,
        extensionOriginal: extension,
        tamanoBytes: archivo.size,
        hashSha256: calcularHash(archivo.buffer),
        estadoConversion,
        errorConversion,
    };
}

async function eliminarArchivoSiExiste(rutaRelativa) {
    if (!rutaRelativa) {
        return;
    }

    try {
        await unlink(path.join(DIRECTORIO_RAIZ, rutaRelativa));
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error(
                `No se pudo limpiar el archivo ${rutaRelativa}:`,
                error,
            );
        }
    }
}

async function limpiarArchivosGuardados(datosArchivo) {
    const rutas = new Set([
        datosArchivo.archivoOriginalUrl,
        datosArchivo.archivoPdfUrl,
    ]);

    await Promise.all(
        [...rutas].map((ruta) => eliminarArchivoSiExiste(ruta)),
    );
}

export async function crearDocumentoConArchivo({
    nombre,
    tipoDocumentoId,
    origen,
    procesoId,
    version,
    elaboradorId,
    archivo,
}) {
    const datosArchivo = await guardarArchivoDocumento(archivo);
    let client;
    let transaccionIniciada = false;

    try {
        client = await pool.connect();
        await client.query('BEGIN');
        transaccionIniciada = true;

        const resultadoDocumento = await client.query(
            `INSERT INTO documentos (
                nombre,
                tipo_documento_id,
                origen,
                estado,
                elaborador_id,
                proceso_id
            )
            SELECT
                $1,
                td.id,
                $3,
                'borrador',
                $4,
                p.id
            FROM tipos_documento td
            LEFT JOIN procesos p
                ON p.id = $5
                AND p.estatus = 'activo'
            WHERE td.id = $2
                AND td.activo = TRUE
                AND ($5::integer IS NULL OR p.id IS NOT NULL)
            RETURNING *`,
            [
                nombre,
                tipoDocumentoId,
                origen,
                elaboradorId,
                procesoId,
            ],
        );

        const documento = resultadoDocumento.rows[0];

        if (!documento) {
            throw crearError(
                'El tipo de documento o el proceso no son válidos.',
                400,
            );
        }

        const resultadoVersion = await client.query(
            `INSERT INTO documento_versiones (
                documento_id,
                version,
                archivo_original_url,
                archivo_pdf_url,
                nombre_original,
                tipo_mime,
                extension_original,
                tamano_bytes,
                hash_sha256,
                creado_por,
                estado_conversion,
                error_conversion,
                vigente
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                $8, $9, $10, $11, $12, FALSE
            )
            RETURNING *`,
            [
                documento.id,
                version,
                datosArchivo.archivoOriginalUrl,
                datosArchivo.archivoPdfUrl,
                datosArchivo.nombreOriginal,
                datosArchivo.tipoMime,
                datosArchivo.extensionOriginal,
                datosArchivo.tamanoBytes,
                datosArchivo.hashSha256,
                elaboradorId,
                datosArchivo.estadoConversion,
                datosArchivo.errorConversion,
            ],
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        return {
            ...documento,
            version_actual: resultadoVersion.rows[0],
        };
    } catch (error) {
        if (client && transaccionIniciada) {
            await client.query('ROLLBACK');
        }

        await limpiarArchivosGuardados(datosArchivo);
        throw error;
    } finally {
        client?.release();
    }
}

export async function listarTiposDocumento() {
    const { rows } = await pool.query(
        `SELECT
            id,
            nombre
            FROM tipos_documento
            WHERE activo = TRUE
            ORDER BY nombre`,
    );

    return rows;
}

export async function listarDocumentosControl() {
    const { rows } = await pool.query(
        `SELECT
       d.id,
       COALESCE(d.codigo, 'Pendiente') AS codigo,
       d.nombre,
       d.origen,
       d.estado,
       d.creado_en,
       td.nombre AS tipo,
       p.nombre AS proceso,
       u.nombre AS elaborador,
       dv.id AS version_id,
        dv.version,
        dv.nombre_original,
        dv.estado_conversion,
        dv.creado_en AS version_creada_en,
        (
        SELECT solicitud.estado
        FROM solicitudes solicitud
        WHERE solicitud.documento_id = d.id
            AND solicitud.version_documento_id = dv.id
        ORDER BY solicitud.id DESC
        LIMIT 1
        ) AS solicitud_estado
     FROM documentos d
     JOIN tipos_documento td
       ON td.id = d.tipo_documento_id
     JOIN usuarios u
       ON u.id = d.elaborador_id
     LEFT JOIN procesos p
       ON p.id = d.proceso_id
     LEFT JOIN LATERAL (
       SELECT
         version_documento.id,
         version_documento.version,
         version_documento.nombre_original,
         version_documento.estado_conversion,
         version_documento.creado_en
       FROM documento_versiones version_documento
       WHERE version_documento.documento_id = d.id
       ORDER BY
         version_documento.creado_en DESC,
         version_documento.id DESC
       LIMIT 1
     ) dv ON TRUE
     ORDER BY d.creado_en DESC, d.id DESC`,
    );

    return rows;
}

export async function obtenerArchivoDocumento({
    documentoId,
    versionId,
    tipo,
    rol,
}) {
    if (!['original', 'pdf'].includes(tipo)) {
        throw crearError('El tipo de descarga no es válido.', 400);
    }

    const { rows } = await pool.query(
        `SELECT
       d.estado,
       dv.archivo_original_url,
       dv.archivo_pdf_url,
       dv.nombre_original,
       dv.tipo_mime,
       dv.estado_conversion
     FROM documentos d
     JOIN documento_versiones dv
       ON dv.documento_id = d.id
     WHERE d.id = $1
       AND dv.id = $2`,
        [documentoId, versionId],
    );

    const registro = rows[0];

    if (!registro) {
        throw crearError(
            'El documento o la versión no existen.',
            404,
        );
    }

    if (rol === 'visor' && registro.estado !== 'vigente') {
        throw crearError(
            'No tienes permiso para consultar esta versión.',
            403,
        );
    }

    const esPdf = tipo === 'pdf';

    const rutaRelativa = esPdf
        ? registro.archivo_pdf_url
        : registro.archivo_original_url;

    if (!rutaRelativa) {
        throw crearError(
            esPdf
                ? 'La versión PDF todavía no está disponible.'
                : 'El archivo original no está disponible.',
            409,
        );
    }

    const rutaAbsoluta = resolverRutaSegura(rutaRelativa);

    try {
        await access(rutaAbsoluta);
    } catch {
        throw crearError(
            'El archivo ya no está disponible en el almacenamiento.',
            404,
        );
    }

    const nombreOriginal = path
        .basename(registro.nombre_original || 'documento')
        .replace(/[\r\n"]/g, '_');

    const nombreDescarga = esPdf
        ? `${path.parse(nombreOriginal).name}.pdf`
        : nombreOriginal;

    return {
        rutaAbsoluta,
        nombreDescarga,
        tipoMime: esPdf
            ? 'application/pdf'
            : registro.tipo_mime,
    };
}

export async function listarDocumentosVisor() {
    const { rows } = await pool.query(
        `SELECT
       d.id,
       d.codigo,
       d.nombre,
       d.origen,
       d.estado,
       td.nombre AS tipo,
       p.nombre AS proceso,
       dv.id AS version_id,
       dv.version,
       dv.nombre_original
     FROM documentos d
     JOIN tipos_documento td
       ON td.id = d.tipo_documento_id
     LEFT JOIN procesos p
       ON p.id = d.proceso_id
     JOIN LATERAL (
       SELECT
         version_documento.id,
         version_documento.version,
         version_documento.nombre_original
       FROM documento_versiones version_documento
       WHERE version_documento.documento_id = d.id
         AND version_documento.vigente = TRUE
         AND version_documento.archivo_pdf_url IS NOT NULL
       ORDER BY
         version_documento.creado_en DESC,
         version_documento.id DESC
       LIMIT 1
     ) dv ON TRUE
     WHERE d.estado = 'vigente'
     ORDER BY d.nombre`,
    );

    return rows;
}

export async function listarParticipantesFlujo() {
    const { rows } = await pool.query(
        `SELECT
       u.id,
       u.nombre,
       u.correo,
       r.clave AS rol_clave,
       r.nombre AS rol
     FROM usuarios u
     JOIN roles r
       ON r.id = u.rol_id
     WHERE u.activo = TRUE
       AND r.clave IN (
         'responsable',
         'revisor',
         'aprobador'
       )
     ORDER BY r.nombre, u.nombre`,
    );

    return rows;
}

export async function enviarARevision({
    documentoId,
    versionId,
    solicitanteId,
    solicitanteRol,
    responsableId,
    revisorId,
    aprobadorId,
    comentario,
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const resultadoDocumento = await client.query(
            `SELECT
         d.id,
         d.estado,
         d.proceso_id,
         d.elaborador_id,
         p.responsable_id AS responsable_proceso_id,
         dv.id AS version_id,
         dv.estado_conversion
       FROM documentos d
       JOIN documento_versiones dv
         ON dv.documento_id = d.id
       LEFT JOIN procesos p
         ON p.id = d.proceso_id
       WHERE d.id = $1
         AND dv.id = $2
       FOR UPDATE OF d`,
            [documentoId, versionId],
        );

        const documento = resultadoDocumento.rows[0];

        if (!documento) {
            throw crearError(
                'El documento o la versión no existen.',
                404,
            );
        }

        const puedeEnviar =
            solicitanteRol === 'admin_general' ||
            documento.elaborador_id === solicitanteId ||
            documento.responsable_proceso_id === solicitanteId;

        if (!puedeEnviar) {
            throw crearError(
                'No tienes permiso para enviar este borrador.',
                403,
            );
        }

        if (documento.estado !== 'borrador') {
            throw crearError(
                'Solo se pueden enviar documentos en borrador.',
                409,
            );
        }

        if (
            !['completada', 'no_requerida'].includes(
                documento.estado_conversion,
            )
        ) {
            throw crearError(
                'El documento no tiene un PDF disponible.',
                409,
            );
        }

        const solicitudActiva = await client.query(
            `SELECT id
       FROM solicitudes
       WHERE documento_id = $1
         AND version_documento_id = $2
         AND estado IN (
           'pendiente',
           'en_responsable',
           'en_revisor',
           'en_aprobador'
         )
       LIMIT 1`,
            [documentoId, versionId],
        );

        if (solicitudActiva.rows[0]) {
            throw crearError(
                'Esta versión ya tiene una solicitud activa.',
                409,
            );
        }

        const responsableValidado =
            await validarParticipante(
                client,
                responsableId,
                'responsable',
            );

        const revisorValidado =
            await validarParticipante(
                client,
                revisorId,
                'revisor',
            );

        const aprobadorValidado =
            await validarParticipante(
                client,
                aprobadorId,
                'aprobador',
                true,
            );

        const estadoInicial = responsableValidado
            ? 'en_responsable'
            : revisorValidado
                ? 'en_revisor'
                : 'en_aprobador';

        const destinatarioInicial =
            responsableValidado ||
            revisorValidado ||
            aprobadorValidado;

        const resultadoTipo = await client.query(
            `SELECT id
       FROM tipos_solicitud
       WHERE clave = 'alta'`,
        );

        const tipoSolicitudId = resultadoTipo.rows[0]?.id;

        if (!tipoSolicitudId) {
            throw crearError(
                'No está configurado el tipo de solicitud de alta.',
                500,
            );
        }

        const resultadoSolicitud = await client.query(
            `INSERT INTO solicitudes (
         tipo_solicitud_id,
         documento_id,
         version_documento_id,
         proceso_id,
         solicitante_id,
         estado,
         fecha_modificacion,
         responsable_asignado_id,
         revisor_asignado_id,
         aprobador_asignado_id,
         actualizado_en
       )
       VALUES (
         $1, $2, $3, $4, $5, $6, CURRENT_DATE,
         $7, $8, $9, now()
       )
       RETURNING *`,
            [
                tipoSolicitudId,
                documentoId,
                versionId,
                documento.proceso_id,
                solicitanteId,
                estadoInicial,
                responsableValidado,
                revisorValidado,
                aprobadorValidado,
            ],
        );

        const solicitud = resultadoSolicitud.rows[0];

        await client.query(
            `INSERT INTO solicitud_historial (
                solicitud_id,
                estado,
                actor_id,
                comentario
            )
            VALUES ($1, $2, $3, $4)`,
            [
                solicitud.id,
                estadoInicial,
                solicitanteId,
                comentario ||
                'Documento enviado al flujo de revisión.',
            ],
        );

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [
                destinatarioInicial,
                'Tienes una solicitud documental pendiente de revisión.',
                '/solicitudes',
            ],
        );

        await client.query(
            `UPDATE documentos
       SET estado = 'en_revision'
       WHERE id = $1`,
            [documentoId],
        );

        await client.query('COMMIT');

        return solicitud;
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function reemplazarArchivoCorregido({
    documentoId,
    versionId,
    usuarioId,
    usuarioRol,
    archivo,
}) {
    if (!archivo) {
        throw crearError(
            'Debes seleccionar el archivo corregido.',
            400,
        );
    }

    const datosArchivo = await guardarArchivoDocumento(archivo);

    if (
        !['completada', 'no_requerida'].includes(
            datosArchivo.estadoConversion,
        )
    ) {
        await limpiarArchivosGuardados(datosArchivo);

        throw crearError(
            datosArchivo.errorConversion ||
            'No se pudo generar el archivo PDF.',
            422,
        );
    }

    const client = await pool.connect();
    let transaccionIniciada = false;

    try {
        await client.query('BEGIN');
        transaccionIniciada = true;
        const resultado = await client.query(
            `SELECT
                d.id,
                d.estado,
                d.elaborador_id,
                p.responsable_id AS responsable_proceso_id,
                dv.id AS version_id,
                dv.vigente,
                dv.archivo_original_url,
                dv.archivo_pdf_url,
                s.id AS solicitud_id,
                s.estado AS solicitud_estado,
                s.responsable_asignado_id,
                s.revisor_asignado_id,
                s.aprobador_asignado_id
            FROM documentos d
            JOIN documento_versiones dv
                ON dv.documento_id = d.id
            LEFT JOIN procesos p
                ON p.id = d.proceso_id
            LEFT JOIN LATERAL (
                SELECT
                    solicitud.id,
                    solicitud.estado,
                    solicitud.responsable_asignado_id,
                    solicitud.revisor_asignado_id,
                    solicitud.aprobador_asignado_id
                FROM solicitudes solicitud
                WHERE solicitud.documento_id = d.id
                AND solicitud.version_documento_id = dv.id
                ORDER BY solicitud.id DESC
                LIMIT 1
            ) s ON TRUE
            WHERE d.id = $1
                AND dv.id = $2
            FOR UPDATE OF d, dv`,
            [documentoId, versionId],
        );

        const documento = resultado.rows[0];
        if (!documento) {
            throw crearError(
                'El documento o la versión no existen.',
                404,
            );
        }

        const puedeCorregir =
            usuarioRol === 'admin_general' ||
            documento.elaborador_id === usuarioId ||
            documento.responsable_proceso_id === usuarioId;

        if (!puedeCorregir) {
            throw crearError(
                'No tienes permiso para corregir este documento.',
                403,
            );
        }

        if (
            documento.estado !== 'borrador' ||
            documento.solicitud_estado !== 'correcciones'
        ) {
            throw crearError(
                'El documento no está pendiente de correcciones.',
                409,
            );
        }

        if (documento.vigente) {
            throw crearError(
                'No se puede reemplazar una versión vigente.',
                409,
            );
        }

        const estadoReenvio =
            documento.responsable_asignado_id
                ? 'en_responsable'
                : documento.revisor_asignado_id
                    ? 'en_revisor'
                    : 'en_aprobador';

        const destinatarioReenvio =
            documento.responsable_asignado_id ||
            documento.revisor_asignado_id ||
            documento.aprobador_asignado_id;

        if (!destinatarioReenvio) {
            throw crearError(
                'La solicitud no tiene participantes asignados.',
                409,
            );
        }

        const resultadoVersion = await client.query(
            `UPDATE documento_versiones
            SET archivo_original_url = $1,
                archivo_pdf_url = $2,
                nombre_original = $3,
                tipo_mime = $4,
                extension_original = $5,
                tamano_bytes = $6,
                hash_sha256 = $7,
                creado_por = $8,
                estado_conversion = $9,
                error_conversion = $10
            WHERE id = $11
                AND documento_id = $12
            RETURNING *`,
            [
                datosArchivo.archivoOriginalUrl,
                datosArchivo.archivoPdfUrl,
                datosArchivo.nombreOriginal,
                datosArchivo.tipoMime,
                datosArchivo.extensionOriginal,
                datosArchivo.tamanoBytes,
                datosArchivo.hashSha256,
                usuarioId,
                datosArchivo.estadoConversion,
                datosArchivo.errorConversion,
                versionId,
                documentoId,
            ],
        );

        await client.query(
            `UPDATE solicitudes
            SET estado = $1,
                actualizado_en = now()
            WHERE id = $2`,
            [
                estadoReenvio,
                documento.solicitud_id,
            ],
        );

        await client.query(
            `UPDATE documentos
            SET estado = 'en_revision'
            WHERE id = $1`,
            [documentoId],
        );

        await client.query(
            `INSERT INTO solicitud_historial (
                solicitud_id,
                estado,
                actor_id,
                comentario
            )
            VALUES ($1, $2, $3, $4)`,
            [
                documento.solicitud_id,
                estadoReenvio,
                usuarioId,
                'Se cargó el archivo corregido y se reenvió a revisión.',
            ],
        );

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [
                destinatarioReenvio,
                'Se recibió un documento corregido para revisión.',
                '/solicitudes',
            ],
        );

        await client.query('COMMIT');
        transaccionIniciada = false;

        await limpiarArchivosGuardados({
            archivoOriginalUrl: documento.archivo_original_url,
            archivoPdfUrl: documento.archivo_pdf_url,
        });

        return resultadoVersion.rows[0];
    } catch (error) {
        if (transaccionIniciada) {
            await client.query('ROLLBACK');
        }

        await limpiarArchivosGuardados(datosArchivo);
        throw error;
    } finally {
        client.release();
    }
}