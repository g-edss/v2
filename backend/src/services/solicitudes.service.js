import { randomUUID } from "node:crypto";
import { access, mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { pool } from "../config/db.js";
import {
    guardarArchivoDocumento,
    limpiarArchivosGuardados,
} from "./documentos.service.js";

const DIRECTORIO_RAIZ = process.env.STORAGE_DIR || "/app/storage";

const DIRECTORIO_SOLICITUDES = path.join(DIRECTORIO_RAIZ, "solicitudes");

function crearError(mensaje, status = 500) {
    const error = new Error(mensaje);
    error.status = status;
    error.publico = mensaje;

    return error;
}

function resolverRutaSegura(rutaRelativa) {
    const raizAbsoluta = path.resolve(DIRECTORIO_RAIZ);
    const rutaAbsoluta = path.resolve(DIRECTORIO_RAIZ, rutaRelativa);

    if (
        rutaAbsoluta !== raizAbsoluta &&
        !rutaAbsoluta.startsWith(`${raizAbsoluta}${path.sep}`)
    ) {
        throw crearError("La ruta del archivo no es válida.", 400);
    }

    return rutaAbsoluta;
}

function calcularVersionSiguiente(versionActual) {
    const coincidencia = String(versionActual || "")
        .trim()
        .match(/^(\d+)(?:\.(\d+))?$/);

    if (!coincidencia) {
        return `${versionActual || "1.0"}-actualizada`;
    }

    const mayor = Number(coincidencia[1]);
    const menor = Number(coincidencia[2] || 0) + 1;

    return `${mayor}.${menor}`;
}

async function obtenerVersionDisponible(
    client,
    documentoId,
    versionActual,
) {
    let candidata = calcularVersionSiguiente(versionActual);
    let sufijo = 2;

    while (true) {
        const { rows } = await client.query(
            `SELECT 1
            FROM documento_versiones
            WHERE documento_id = $1
                AND version = $2`,
            [documentoId, candidata],
        );

        if (!rows[0]) {
            return candidata;
        }

        candidata = `${calcularVersionSiguiente(versionActual)}-${sufijo}`;
        sufijo += 1;
    }
}

async function guardarArchivosSolicitud(archivos = []) {
    if (archivos.length === 0) {
        return [];
    }

    await mkdir(DIRECTORIO_SOLICITUDES, { recursive: true });

    const archivosGuardados = [];

    try {
        for (const archivo of archivos) {
            const extension = path.extname(archivo.originalname).toLowerCase();

            const nombreSeguro = `${randomUUID()}${extension}`;

            const rutaRelativa = path.posix.join("solicitudes", nombreSeguro);

            const rutaAbsoluta = path.join(DIRECTORIO_RAIZ, rutaRelativa);

            await writeFile(rutaAbsoluta, archivo.buffer);

            archivosGuardados.push({
                archivoUrl: rutaRelativa,
                rutaAbsoluta,
                nombreArchivo: path.basename(archivo.originalname),
                tipoMime: archivo.mimetype,
                tamanoBytes: archivo.size,
            });
        }

        return archivosGuardados;
    } catch (error) {
        await Promise.allSettled(
            archivosGuardados.map((archivo) => unlink(archivo.rutaAbsoluta)),
        );

        throw error;
    }
}

async function validarParticipante(
    client,
    usuarioId,
    rolEsperado,
    obligatorio = false,
) {
    if (!usuarioId) {
        if (obligatorio) {
            throw crearError(`Debes seleccionar un ${rolEsperado}.`, 400);
        }

        return null;
    }

    const { rows } = await client.query(
        `SELECT
            u.id,
            r.clave AS rol
        FROM usuarios u
        JOIN roles r
            ON r.id = u.rol_id
        WHERE u.id = $1
            AND u.activo = TRUE`,
        [usuarioId],
    );

    const participante = rows[0];

    if (!participante) {
        throw crearError(
            "El usuario seleccionado no existe o está inactivo.",
            400,
        );
    }

    if (participante.rol !== rolEsperado) {
        throw crearError(
            `El usuario seleccionado no tiene el rol de ${rolEsperado}.`,
            400,
        );
    }

    return Number(participante.id);
}

function obtenerUsuarioAsignado(solicitud) {
    const usuariosPorEstado = {
        en_responsable: solicitud.responsable_asignado_id,
        en_revisor: solicitud.revisor_asignado_id,
        en_aprobador: solicitud.aprobador_asignado_id,
    };

    return usuariosPorEstado[solicitud.estado] || null;
}

function validarUsuarioAsignado(solicitud, usuarioId) {
    const usuarioAsignado = obtenerUsuarioAsignado(solicitud);

    if (!usuarioAsignado || Number(usuarioAsignado) !== Number(usuarioId)) {
        throw crearError(
            "Esta solicitud no está asignada al usuario actual.",
            403,
        );
    }
}

export async function listarSolicitudes({ usuarioId, rol }) {
    const { rows } = await pool.query(
        `SELECT
            s.id,
            s.estado,
            s.creado_en,
            s.documento_id,
            s.version_documento_id,
            s.registro_id,
            s.descripcion,
            d.codigo,
            COALESCE(
                d.nombre,
                registro.nombre
            ) AS documento,
            dv.version,
            registro.fecha_registro,
            registro.nombre_archivo,
            (s.registro_id IS NOT NULL) AS es_registro,
            ts.nombre AS tipo_solicitud,
            ts.clave AS tipo_clave,
            u.nombre AS solicitante,
            proceso.nombre AS proceso,
            responsable.nombre AS responsable,
            revisor.nombre AS revisor,
            aprobador.nombre AS aprobador,
            COALESCE(archivos.lista, '[]'::json) AS archivos,
            (
                (
                    s.estado = 'en_responsable'
                    AND s.responsable_asignado_id = $1
                )
                OR (
                    s.estado = 'en_revisor'
                    AND s.revisor_asignado_id = $1
                )
                OR (
                    s.estado = 'en_aprobador'
                    AND s.aprobador_asignado_id = $1
                )
            ) AS puede_atender
        FROM solicitudes s
        JOIN tipos_solicitud ts
            ON ts.id = s.tipo_solicitud_id
        LEFT JOIN documentos d
            ON d.id = s.documento_id
        LEFT JOIN documento_versiones dv
            ON dv.id = s.version_documento_id
        LEFT JOIN registros registro
            ON registro.id = s.registro_id
        JOIN usuarios u
            ON u.id = s.solicitante_id
        LEFT JOIN procesos proceso
            ON proceso.id = s.proceso_id
        LEFT JOIN usuarios responsable
            ON responsable.id = s.responsable_asignado_id
        LEFT JOIN usuarios revisor
            ON revisor.id = s.revisor_asignado_id
        LEFT JOIN usuarios aprobador
            ON aprobador.id = s.aprobador_asignado_id
        LEFT JOIN LATERAL (
            SELECT json_agg(
                json_build_object(
                    'id', archivo.id,
                    'nombre_archivo', archivo.nombre_archivo,
                    'tipo_mime', archivo.tipo_mime,
                    'tamano_bytes', archivo.tamano_bytes
                )
                ORDER BY archivo.id
            ) AS lista
            FROM solicitud_archivos archivo
            WHERE archivo.solicitud_id = s.id
        ) archivos ON TRUE
        WHERE
            $2 = 'admin_general'
            OR s.solicitante_id = $1
            OR d.elaborador_id = $1
            OR registro.creado_por = $1
            OR registro.responsable_id = $1
            OR s.responsable_asignado_id = $1
            OR s.revisor_asignado_id = $1
            OR s.aprobador_asignado_id = $1
        ORDER BY
            s.creado_en DESC,
            s.id DESC`,
        [usuarioId, rol],
    );

    return rows;
}

export async function obtenerArchivoSolicitud({
    solicitudId,
    archivoId,
    usuarioId,
    rol,
}) {
    const { rows } = await pool.query(
        `SELECT
            archivo.archivo_url,
            archivo.nombre_archivo,
            archivo.tipo_mime
        FROM solicitud_archivos archivo
        JOIN solicitudes solicitud
            ON solicitud.id = archivo.solicitud_id
        LEFT JOIN documentos documento
            ON documento.id = solicitud.documento_id
        LEFT JOIN registros registro
            ON registro.id = solicitud.registro_id
        WHERE solicitud.id = $1
            AND archivo.id = $2
            AND (
                $4 = 'admin_general'
                OR solicitud.solicitante_id = $3
                OR documento.elaborador_id = $3
                OR registro.creado_por = $3
                OR registro.responsable_id = $3
                OR solicitud.responsable_asignado_id = $3
                OR solicitud.revisor_asignado_id = $3
                OR solicitud.aprobador_asignado_id = $3
            )`,
        [solicitudId, archivoId, usuarioId, rol],
    );

    const archivo = rows[0];

    if (!archivo) {
        throw crearError(
            "El archivo no existe o no tienes permiso para descargarlo.",
            404,
        );
    }

    const rutaAbsoluta = resolverRutaSegura(archivo.archivo_url);

    try {
        await access(rutaAbsoluta);
    } catch {
        throw crearError(
            "El archivo ya no está disponible en el almacenamiento.",
            404,
        );
    }

    return {
        rutaAbsoluta,
        nombreDescarga: archivo.nombre_archivo,
        tipoMime: archivo.tipo_mime,
    };
}

export async function crearSolicitudDocumento({
    tipoClave,
    documentoId,
    solicitanteId,
    descripcion,
    archivos = [],
}) {
    const tipoNormalizado = String(tipoClave || "")
        .trim()
        .toLowerCase();

    const descripcionNormalizada = String(descripcion || "").trim();

    if (!["cambio", "baja"].includes(tipoNormalizado)) {
        throw crearError(
            "Solo se pueden crear solicitudes de cambio o baja.",
            400,
        );
    }

    if (!Number.isInteger(documentoId) || documentoId <= 0) {
        throw crearError("Debes seleccionar un documento válido.", 400);
    }

    if (!descripcionNormalizada) {
        throw crearError("Debes explicar el motivo de la solicitud.", 400);
    }

    if (descripcionNormalizada.length > 2000) {
        throw crearError(
            "La descripción debe tener máximo 2000 caracteres.",
            400,
        );
    }

    if (tipoNormalizado === "cambio" && archivos.length === 0) {
        throw crearError(
            "Adjunta el archivo que se convertirá en la nueva versión.",
            400,
        );
    }

    const client = await pool.connect();
    let archivosGuardados = [];

    try {
        await client.query("BEGIN");

        const resultadoDocumento = await client.query(
            `SELECT
                d.id,
                d.nombre,
                d.estado,
                d.proceso_id,
                p.responsable_id,
                dv.id AS version_id,
                flujo.revisor_asignado_id,
                flujo.aprobador_asignado_id
            FROM documentos d
            LEFT JOIN procesos p
                ON p.id = d.proceso_id
            LEFT JOIN LATERAL (
                SELECT version.id
                FROM documento_versiones version
                WHERE version.documento_id = d.id
                    AND version.vigente = TRUE
                ORDER BY version.id DESC
                LIMIT 1
            ) dv ON TRUE
            LEFT JOIN LATERAL (
                SELECT
                    solicitud.revisor_asignado_id,
                    solicitud.aprobador_asignado_id
                FROM solicitudes solicitud
                WHERE solicitud.documento_id = d.id
                    AND solicitud.aprobador_asignado_id IS NOT NULL
                ORDER BY solicitud.id DESC
                LIMIT 1
            ) flujo ON TRUE
            WHERE d.id = $1
            FOR UPDATE OF d`,
            [documentoId],
        );

        const documento = resultadoDocumento.rows[0];

        if (!documento) {
            throw crearError("El documento seleccionado no existe.", 404);
        }

        if (documento.estado !== "vigente") {
            throw crearError(
                "Solo se pueden solicitar cambios o bajas de documentos vigentes.",
                409,
            );
        }

        if (!documento.proceso_id) {
            throw crearError("El documento no tiene un proceso asignado.", 409);
        }

        if (!documento.version_id) {
            throw crearError("El documento no tiene una versión vigente.", 409);
        }

        const solicitudActiva = await client.query(
            `SELECT id
            FROM solicitudes
            WHERE documento_id = $1
                AND estado IN (
                    'pendiente',
                    'en_responsable',
                    'en_revisor',
                    'en_aprobador',
                    'correcciones'
                )
            LIMIT 1`,
            [documentoId],
        );

        if (solicitudActiva.rows[0]) {
            throw crearError(
                "Este documento ya tiene una solicitud activa.",
                409,
            );
        }

        const responsableValidado = await validarParticipante(
            client,
            documento.responsable_id,
            "responsable",
            true,
        );

        const revisorValidado = await validarParticipante(
            client,
            documento.revisor_asignado_id,
            "revisor",
        );

        const aprobadorValidado = await validarParticipante(
            client,
            documento.aprobador_asignado_id,
            "aprobador",
            true,
        );

        const resultadoTipo = await client.query(
            `SELECT id
            FROM tipos_solicitud
            WHERE clave = $1`,
            [tipoNormalizado],
        );

        const tipoSolicitudId = resultadoTipo.rows[0]?.id;

        if (!tipoSolicitudId) {
            throw crearError("El tipo de solicitud no está configurado.", 500);
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
                descripcion,
                actualizado_en
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                'en_responsable',
                CURRENT_DATE,
                $6,
                $7,
                $8,
                $9,
                NOW()
            )
            RETURNING *`,
            [
                tipoSolicitudId,
                documento.id,
                documento.version_id,
                documento.proceso_id,
                solicitanteId,
                responsableValidado,
                revisorValidado,
                aprobadorValidado,
                descripcionNormalizada,
            ],
        );

        const solicitud = resultadoSolicitud.rows[0];

        archivosGuardados = await guardarArchivosSolicitud(archivos);

        for (const archivo of archivosGuardados) {
            await client.query(
                `INSERT INTO solicitud_archivos (
                    solicitud_id,
                    archivo_url,
                    nombre_archivo,
                    tipo_mime,
                    tamano_bytes
                )
                VALUES ($1, $2, $3, $4, $5)`,
                [
                    solicitud.id,
                    archivo.archivoUrl,
                    archivo.nombreArchivo,
                    archivo.tipoMime,
                    archivo.tamanoBytes,
                ],
            );
        }

        await client.query(
            `INSERT INTO solicitud_historial (
                solicitud_id,
                estado,
                actor_id,
                comentario
            )
            VALUES (
                $1,
                'en_responsable',
                $2,
                $3
            )`,
            [solicitud.id, solicitanteId, descripcionNormalizada],
        );

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, '/solicitudes')`,
            [
                responsableValidado,
                `Tienes una solicitud de ${tipoNormalizado} pendiente para el documento ${documento.nombre}.`,
            ],
        );

        await client.query("COMMIT");

        return solicitud;
    } catch (error) {
        await client.query("ROLLBACK");

        await Promise.allSettled(
            archivosGuardados.map((archivo) => unlink(archivo.rutaAbsoluta)),
        );

        throw error;
    } finally {
        client.release();
    }
}

export async function avanzarSolicitud({ solicitudId, usuarioId, comentario }) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { rows } = await client.query(
            `SELECT
                s.id,
                s.estado,
                s.registro_id,
                s.responsable_asignado_id,
                s.revisor_asignado_id,
                s.aprobador_asignado_id
                FROM solicitudes s
                WHERE s.id = $1
                FOR UPDATE`,
            [solicitudId],
        );

        const solicitud = rows[0];

        if (!solicitud) {
            throw crearError("La solicitud no existe.", 404);
        }

        let estadoSiguiente;
        let destinatarioSiguiente;

        if (solicitud.estado === "en_responsable") {
            if (
                Number(solicitud.responsable_asignado_id) !== Number(usuarioId)
            ) {
                throw crearError(
                    "Esta solicitud no está asignada al usuario actual.",
                    403,
                );
            }

            if (solicitud.revisor_asignado_id) {
                estadoSiguiente = "en_revisor";
                destinatarioSiguiente = solicitud.revisor_asignado_id;
            } else {
                estadoSiguiente = "en_aprobador";
                destinatarioSiguiente = solicitud.aprobador_asignado_id;
            }
        } else if (solicitud.estado === "en_revisor") {
            if (Number(solicitud.revisor_asignado_id) !== Number(usuarioId)) {
                throw crearError(
                    "Esta solicitud no está asignada al usuario actual.",
                    403,
                );
            }

            estadoSiguiente = "en_aprobador";
            destinatarioSiguiente = solicitud.aprobador_asignado_id;
        } else {
            throw crearError(
                "La solicitud no está en una etapa intermedia.",
                409,
            );
        }

        if (!destinatarioSiguiente) {
            throw crearError(
                "La siguiente etapa no tiene un usuario asignado.",
                409,
            );
        }

        await client.query(
            `UPDATE solicitudes
            SET estado = $1,
                actualizado_en = now()
            WHERE id = $2`,
            [estadoSiguiente, solicitud.id],
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
                solicitud.id,
                estadoSiguiente,
                usuarioId,
                comentario || "La solicitud avanzó a la siguiente etapa.",
            ],
        );

        const tipoElemento = solicitud.registro_id ? "registro" : "documento";

        const mensajeNotificacion =
            estadoSiguiente === "en_revisor"
                ? `Tienes un ${tipoElemento} pendiente de revisión.`
                : `Tienes un ${tipoElemento} pendiente de aprobación.`;

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [destinatarioSiguiente, mensajeNotificacion, "/solicitudes"],
        );

        await client.query("COMMIT");

        return {
            ...solicitud,
            estado: estadoSiguiente,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function aprobarSolicitud({
    solicitudId,
    usuarioId,
    comentario,
    codigo,
}) {
    const codigoNormalizado = String(codigo || "")
        .trim()
        .toUpperCase();

    const client = await pool.connect();
    let datosNuevaVersion = null;

    try {
        await client.query("BEGIN");

        const { rows } = await client.query(
            `SELECT
                s.id,
                s.estado,
                s.documento_id,
                s.version_documento_id,
                s.registro_id,
                s.solicitante_id,
                s.aprobador_asignado_id,
                ts.clave AS tipo_clave,
                d.elaborador_id,
                dv.version AS version_actual,
                registro.creado_por AS registro_creado_por,
                archivo.archivo_url AS archivo_solicitud_url,
                archivo.nombre_archivo AS archivo_solicitud_nombre,
                archivo.tipo_mime AS archivo_solicitud_mime,
                archivo.tamano_bytes AS archivo_solicitud_tamano
            FROM solicitudes s
            JOIN tipos_solicitud ts
                ON ts.id = s.tipo_solicitud_id
            LEFT JOIN documentos d
                ON d.id = s.documento_id
            LEFT JOIN documento_versiones dv
                ON dv.id = s.version_documento_id
            LEFT JOIN registros registro
                ON registro.id = s.registro_id
            LEFT JOIN LATERAL (
                SELECT
                    solicitud_archivo.archivo_url,
                    solicitud_archivo.nombre_archivo,
                    solicitud_archivo.tipo_mime,
                    solicitud_archivo.tamano_bytes
                FROM solicitud_archivos solicitud_archivo
                WHERE solicitud_archivo.solicitud_id = s.id
                ORDER BY solicitud_archivo.id
                LIMIT 1
            ) archivo ON TRUE
            WHERE s.id = $1
            FOR UPDATE OF s`,
            [solicitudId],
        );

        const solicitud = rows[0];

        if (!solicitud) {
            throw crearError("La solicitud no existe.", 404);
        }

        if (solicitud.estado !== "en_aprobador") {
            throw crearError(
                "La solicitud ya fue atendida o no está lista para aprobar.",
                409,
            );
        }

        if (Number(solicitud.aprobador_asignado_id) !== Number(usuarioId)) {
            throw crearError(
                "Esta solicitud no está asignada al usuario actual.",
                403,
            );
        }

        const esRegistro = solicitud.registro_id !== null;
        const esAlta = solicitud.tipo_clave === "alta";
        const esCambio = solicitud.tipo_clave === "cambio";
        const esBaja = solicitud.tipo_clave === "baja";

        if (esAlta && !codigoNormalizado) {
            throw crearError("Debes asignar el código institucional.", 400);
        }

        if (codigoNormalizado.length > 60) {
            throw crearError("El código debe tener máximo 60 caracteres.", 400);
        }

        if (esRegistro) {
            await client.query(
                `UPDATE registros
                SET
                    estado = 'aprobado',
                    actualizado_en = NOW()
                WHERE id = $1`,
                [solicitud.registro_id],
            );
        } else if (esBaja) {
            await client.query(
                `UPDATE documentos
                SET estado = 'obsoleto'
                WHERE id = $1`,
                [solicitud.documento_id],
            );
        } else if (esCambio) {
            if (!solicitud.archivo_solicitud_url) {
                throw crearError(
                    "La solicitud de cambio necesita un archivo con la nueva versión.",
                    409,
                );
            }

            const rutaArchivoSolicitud = resolverRutaSegura(
                solicitud.archivo_solicitud_url,
            );

            let bufferArchivo;

            try {
                bufferArchivo = await readFile(rutaArchivoSolicitud);
            } catch {
                throw crearError(
                    "El archivo propuesto ya no está disponible.",
                    404,
                );
            }

            datosNuevaVersion = await guardarArchivoDocumento({
                buffer: bufferArchivo,
                originalname: solicitud.archivo_solicitud_nombre,
                mimetype:
                    solicitud.archivo_solicitud_mime ||
                    "application/octet-stream",
                size:
                    Number(solicitud.archivo_solicitud_tamano) ||
                    bufferArchivo.length,
            });

            if (datosNuevaVersion.estadoConversion === "error") {
                throw crearError(
                    datosNuevaVersion.errorConversion ||
                        "No se pudo generar el PDF de la nueva versión.",
                    422,
                );
            }

            const versionNueva = await obtenerVersionDisponible(
                client,
                solicitud.documento_id,
                solicitud.version_actual,
            );

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
                RETURNING id`,
                [
                    solicitud.documento_id,
                    versionNueva,
                    datosNuevaVersion.archivoOriginalUrl,
                    datosNuevaVersion.archivoPdfUrl,
                    datosNuevaVersion.nombreOriginal,
                    datosNuevaVersion.tipoMime,
                    datosNuevaVersion.extensionOriginal,
                    datosNuevaVersion.tamanoBytes,
                    datosNuevaVersion.hashSha256,
                    usuarioId,
                    datosNuevaVersion.estadoConversion,
                    datosNuevaVersion.errorConversion,
                ],
            );

            const nuevaVersionId = resultadoVersion.rows[0].id;

            await client.query(
                `UPDATE documento_versiones
                SET vigente = (id = $2)
                WHERE documento_id = $1`,
                [solicitud.documento_id, nuevaVersionId],
            );

            await client.query(
                `UPDATE documentos
                SET estado = 'vigente'
                WHERE id = $1`,
                [solicitud.documento_id],
            );

            await client.query(
                `UPDATE solicitudes
                SET version_documento_id = $2
                WHERE id = $1`,
                [solicitud.id, nuevaVersionId],
            );
        } else {
            await client.query(
                `UPDATE documento_versiones
                SET vigente = (id = $2)
                WHERE documento_id = $1`,
                [solicitud.documento_id, solicitud.version_documento_id],
            );

            await client.query(
                `UPDATE documentos
                SET
                    estado = 'vigente',
                    codigo = $2
                WHERE id = $1`,
                [solicitud.documento_id, codigoNormalizado],
            );
        }

        await client.query(
            `UPDATE solicitudes
            SET
                estado = 'aprobada',
                actualizado_en = NOW()
            WHERE id = $1`,
            [solicitud.id],
        );

        const comentarioHistorial =
            comentario ||
            (esRegistro
                ? "Registro aprobado sin observaciones."
                : esBaja
                    ? "Baja aprobada; el documento quedó obsoleto."
                    : esCambio
                        ? "Cambio aprobado; se publicó una nueva versión."
                        : "Documento aprobado sin observaciones.");

        await client.query(
            `INSERT INTO solicitud_historial (
                solicitud_id,
                estado,
                actor_id,
                comentario
            )
            VALUES (
                $1,
                'aprobada',
                $2,
                $3
            )`,
            [solicitud.id, usuarioId, comentarioHistorial],
        );

        const destinatario = solicitud.solicitante_id;

        const mensajeNotificacion = esRegistro
            ? "Tu registro fue aprobado."
            : esBaja
                ? "La baja fue aprobada y el documento quedó obsoleto."
                : esCambio
                    ? "El cambio fue aprobado y la nueva versión quedó publicada."
                    : "Tu documento fue aprobado y publicado.";

        const enlaceNotificacion = esRegistro
            ? "/almacen-registros"
            : "/visor-documental";

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [destinatario, mensajeNotificacion, enlaceNotificacion],
        );

        await client.query("COMMIT");

        return {
            ...solicitud,
            estado: "aprobada",
            es_registro: esRegistro,
        };
    } catch (error) {
        await client.query("ROLLBACK");

        if (datosNuevaVersion) {
            await limpiarArchivosGuardados(datosNuevaVersion);
        }

        if (
            error.code === "23505" &&
            error.constraint === "documentos_codigo_key"
        ) {
            throw crearError(
                "Ya existe un documento con ese código institucional.",
                409,
            );
        }

        throw error;
    } finally {
        client.release();
    }
}

export async function solicitarCorrecciones({
    solicitudId,
    usuarioId,
    comentario,
}) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { rows } = await client.query(
            `SELECT
                s.id,
                s.estado,
                s.documento_id,
                s.version_documento_id,
                s.registro_id,
                s.solicitante_id,
                s.responsable_asignado_id,
                s.revisor_asignado_id,
                s.aprobador_asignado_id,
                ts.clave AS tipo_clave,
                d.elaborador_id,
                registro.creado_por AS registro_creado_por
            FROM solicitudes s
            JOIN tipos_solicitud ts
                ON ts.id = s.tipo_solicitud_id
            LEFT JOIN documentos d
                ON d.id = s.documento_id
            LEFT JOIN registros registro
                ON registro.id = s.registro_id
            WHERE s.id = $1
            FOR UPDATE OF s`,
            [solicitudId],
        );

        const solicitud = rows[0];

        if (!solicitud) {
            throw crearError("La solicitud no existe.", 404);
        }

        if (
            !["en_responsable", "en_revisor", "en_aprobador"].includes(
                solicitud.estado,
            )
        ) {
            throw crearError(
                "La solicitud ya fue atendida o no está lista.",
                409,
            );
        }

        validarUsuarioAsignado(solicitud, usuarioId);

        if (!comentario) {
            throw crearError(
                "Debes explicar qué correcciones se requieren.",
                400,
            );
        }

        const esRegistro = solicitud.registro_id !== null;

        await client.query(
            `UPDATE solicitudes
            SET
                estado = 'correcciones',
                actualizado_en = NOW()
            WHERE id = $1`,
            [solicitud.id],
        );

        if (esRegistro) {
            await client.query(
                `UPDATE registros
                SET
                    estado = 'correcciones',
                    actualizado_en = NOW()
                WHERE id = $1`,
                [solicitud.registro_id],
            );
        } else if (solicitud.tipo_clave === "alta") {
            await client.query(
                `UPDATE documentos
                SET estado = 'borrador'
                WHERE id = $1`,
                [solicitud.documento_id],
            );
        }

        await client.query(
            `INSERT INTO solicitud_historial (
                solicitud_id,
                estado,
                actor_id,
                comentario
            )
            VALUES (
                $1,
                'correcciones',
                $2,
                $3
            )`,
            [solicitud.id, usuarioId, comentario],
        );

        const destinatario = solicitud.solicitante_id;

        const mensajeNotificacion = esRegistro
            ? `El registro requiere correcciones: ${comentario}`
            : `El documento requiere correcciones: ${comentario}`;

        const enlaceNotificacion = esRegistro
            ? "/almacen-registros"
            : "/solicitudes";

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [destinatario, mensajeNotificacion, enlaceNotificacion],
        );

        await client.query("COMMIT");

        return {
            ...solicitud,
            estado: "correcciones",
            es_registro: esRegistro,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function rechazarSolicitud({
    solicitudId,
    usuarioId,
    comentario,
}) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const { rows } = await client.query(
            `SELECT
                s.id,
                s.estado,
                s.documento_id,
                s.version_documento_id,
                s.registro_id,
                s.solicitante_id,
                s.responsable_asignado_id,
                s.revisor_asignado_id,
                s.aprobador_asignado_id,
                ts.clave AS tipo_clave,
                d.elaborador_id,
                registro.creado_por AS registro_creado_por
            FROM solicitudes s
            JOIN tipos_solicitud ts
                ON ts.id = s.tipo_solicitud_id
            LEFT JOIN documentos d
                ON d.id = s.documento_id
            LEFT JOIN registros registro
                ON registro.id = s.registro_id
            WHERE s.id = $1
            FOR UPDATE OF s`,
            [solicitudId],
        );

        const solicitud = rows[0];

        if (!solicitud) {
            throw crearError("La solicitud no existe.", 404);
        }

        if (
            !["en_responsable", "en_revisor", "en_aprobador"].includes(
                solicitud.estado,
            )
        ) {
            throw crearError(
                "La solicitud ya fue atendida o no está lista.",
                409,
            );
        }

        validarUsuarioAsignado(solicitud, usuarioId);

        if (!comentario) {
            throw crearError("Debes explicar el motivo del rechazo.", 400);
        }

        const esRegistro = solicitud.registro_id !== null;

        await client.query(
            `UPDATE solicitudes
            SET
                estado = 'rechazada',
                actualizado_en = NOW()
            WHERE id = $1`,
            [solicitud.id],
        );

        if (esRegistro) {
            await client.query(
                `UPDATE registros
                SET
                    estado = 'rechazado',
                    actualizado_en = NOW()
                WHERE id = $1`,
                [solicitud.registro_id],
            );
        } else if (solicitud.tipo_clave === "alta") {
            await client.query(
                `UPDATE documentos
                SET estado = 'rechazado'
                WHERE id = $1`,
                [solicitud.documento_id],
            );
        }

        await client.query(
            `INSERT INTO solicitud_historial (
                solicitud_id,
                estado,
                actor_id,
                comentario
            )
            VALUES (
                $1,
                'rechazada',
                $2,
                $3
            )`,
            [solicitud.id, usuarioId, comentario],
        );

        const destinatario = solicitud.solicitante_id;

        const mensajeNotificacion = esRegistro
            ? `Tu registro fue rechazado: ${comentario}`
            : `Tu documento fue rechazado: ${comentario}`;

        const enlaceNotificacion = esRegistro
            ? "/almacen-registros"
            : "/solicitudes";

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [destinatario, mensajeNotificacion, enlaceNotificacion],
        );

        await client.query("COMMIT");

        return {
            ...solicitud,
            estado: "rechazada",
            es_registro: esRegistro,
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}
