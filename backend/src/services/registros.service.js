import { randomUUID } from 'node:crypto';
import { access, mkdir, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pool, query } from '../config/db.js';

const DIRECTORIO_RAIZ = process.env.STORAGE_DIR || '/app/storage';
const DIRECTORIO_REGISTROS = path.join(
    DIRECTORIO_RAIZ,
    'registros'
);

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
    obligatorio = false
) {
    if (usuarioId === null || usuarioId === undefined) {
        if (obligatorio) {
            throw crearError(
                `Debes seleccionar un ${rolEsperado}.`,
                400
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
        [usuarioId, rolEsperado]
    );

    if (!rows[0]) {
        throw crearError(
            `El usuario seleccionado no es un ${rolEsperado} activo.`,
            400
        );
    }

    return rows[0].id;
}

async function guardarArchivo(archivo) {
    if (!archivo?.buffer) {
        const error = new Error('Archivo requerido');
        error.status = 400;
        error.publico = 'Debes seleccionar un archivo.';
        throw error;
    }

    await mkdir(DIRECTORIO_REGISTROS, {
        recursive: true
    });

    const extension = path
        .extname(archivo.originalname)
        .toLowerCase();

    const nombreSeguro = `${randomUUID()}${extension}`;

    const rutaRelativa = path.posix.join(
        'registros',
        nombreSeguro
    );

    const rutaAbsoluta = path.join(
        DIRECTORIO_RAIZ,
        rutaRelativa
    );

    await writeFile(rutaAbsoluta, archivo.buffer);

    return {
        archivoUrl: rutaRelativa,
        nombreArchivo: path.basename(archivo.originalname),
        tipoMime: archivo.mimetype,
        tamanoBytes: archivo.size
    };
}

export async function obtenerArchivo({
    registroId,
    usuarioId,
    rol
}) {
    const { rows } = await query(
        `SELECT
            r.archivo_url,
            r.nombre_archivo,
            r.tipo_mime
        FROM registros r
        WHERE r.id = $1
            AND r.archivo_url IS NOT NULL
            AND (
                $3 = 'admin_general'
                OR r.estado = 'aprobado'
                OR r.responsable_id = $2
                OR r.creado_por = $2
            )`,
        [registroId, usuarioId, rol]
    );

    const registro = rows[0];

    if (!registro) {
        return null;
    }

    const raizAbsoluta = path.resolve(DIRECTORIO_RAIZ);

    const rutaAbsoluta = path.resolve(
        DIRECTORIO_RAIZ,
        registro.archivo_url
    );

    if (
        !rutaAbsoluta.startsWith(
            `${raizAbsoluta}${path.sep}`
        )
    ) {
        const error = new Error('Ruta de archivo no válida');
        error.status = 400;
        error.publico = 'La ruta del archivo no es válida.';
        throw error;
    }

    try {
        await access(rutaAbsoluta);
    } catch {
        const error = new Error('Archivo no encontrado');
        error.status = 404;
        error.publico =
            'El archivo del registro no está disponible.';
        throw error;
    }

    return {
        rutaAbsoluta,
        nombreArchivo: registro.nombre_archivo,
        tipoMime: registro.tipo_mime
    };
}

export async function listar({ usuarioId, rol }) {
    const { rows } = await query(
        `SELECT
            r.id,
            r.nombre,
            r.fecha_registro,
            r.estado,
            r.descripcion,
            r.archivo_url,
            r.nombre_archivo,
            r.tipo_mime,
            r.tamano_bytes,
            r.creado_en,
            p.id AS proceso_id,
            p.nombre AS proceso,
            responsable.id AS responsable_id,
            responsable.nombre AS responsable,
            responsable.correo AS responsable_correo,
            creador.id AS creado_por,
            creador.nombre AS creador
        FROM registros r
        JOIN procesos p
            ON p.id = r.proceso_id
        JOIN usuarios responsable
            ON responsable.id = r.responsable_id
        JOIN usuarios creador
            ON creador.id = r.creado_por
        WHERE
            $2 = 'admin_general'
            OR r.estado = 'aprobado'
            OR r.responsable_id = $1
            OR r.creado_por = $1
        ORDER BY
            r.fecha_registro DESC,
            r.id DESC`,
        [usuarioId, rol]
    );

    return rows;
}

export async function obtenerPorId({
    registroId,
    usuarioId,
    rol
}) {
    const { rows } = await query(
        `SELECT
            r.id,
            r.nombre,
            r.fecha_registro,
            r.estado,
            r.descripcion,
            r.archivo_url,
            r.nombre_archivo,
            r.tipo_mime,
            r.tamano_bytes,
            r.creado_en,
            r.actualizado_en,
            p.id AS proceso_id,
            p.nombre AS proceso,
            responsable.id AS responsable_id,
            responsable.nombre AS responsable,
            responsable.correo AS responsable_correo,
            creador.id AS creado_por,
            creador.nombre AS creador
        FROM registros r
        JOIN procesos p
            ON p.id = r.proceso_id
        JOIN usuarios responsable
            ON responsable.id = r.responsable_id
        JOIN usuarios creador
            ON creador.id = r.creado_por
        WHERE
            r.id = $1
            AND (
                $3 = 'admin_general'
                OR r.estado = 'aprobado'
                OR r.responsable_id = $2
                OR r.creado_por = $2
            )`,
        [
            registroId,
            usuarioId,
            rol
        ]
    );

    return rows[0] || null;
}

export async function crear({
    nombre,
    procesoId,
    responsableId,
    fechaRegistro,
    descripcion,
    archivoUrl,
    nombreArchivo,
    tipoMime,
    tamanoBytes,
    creadoPor
}) {
    const { rows } = await query(
        `INSERT INTO registros (
            nombre,
            proceso_id,
            responsable_id,
            fecha_registro,
            descripcion,
            archivo_url,
            nombre_archivo,
            tipo_mime,
            tamano_bytes,
            creado_por
        )
        SELECT
            $1,
            p.id,
            u.id,
            $2,
            $3,
            $4,
            $5,
            $6,
            $7,
            $8
        FROM procesos p
        JOIN usuarios u
            ON u.id = $9
            AND u.activo = TRUE
        JOIN roles rol
            ON rol.id = u.rol_id
            AND rol.clave = 'responsable'
        WHERE p.id = $10
            AND p.estatus = 'activo'
        RETURNING *`,
        [
            nombre,
            fechaRegistro,
            descripcion,
            archivoUrl,
            nombreArchivo,
            tipoMime,
            tamanoBytes,
            creadoPor,
            responsableId,
            procesoId
        ]
    );

    const registro = rows[0];

    if (!registro) {
        const error = new Error('Proceso o responsable no válido');
        error.status = 400;
        error.publico =
            'El proceso no existe, está inactivo o el responsable no es válido';
        throw error;
    }

    return registro;
}

export async function crearConArchivo({
    nombre,
    procesoId,
    responsableId,
    fechaRegistro,
    descripcion,
    creadoPor,
    archivo
}) {
    const datosArchivo = await guardarArchivo(archivo);

    try {
        return await crear({
            nombre,
            procesoId,
            responsableId,
            fechaRegistro,
            descripcion,
            archivoUrl: datosArchivo.archivoUrl,
            nombreArchivo: datosArchivo.nombreArchivo,
            tipoMime: datosArchivo.tipoMime,
            tamanoBytes: datosArchivo.tamanoBytes,
            creadoPor
        });
    } catch (error) {
        try {
            await unlink(
                path.join(
                    DIRECTORIO_RAIZ,
                    datosArchivo.archivoUrl
                )
            );
        } catch (errorLimpieza) {
            if (errorLimpieza.code !== 'ENOENT') {
                console.error(
                    'No se pudo eliminar el archivo del registro:',
                    errorLimpieza
                );
            }
        }

        throw error;
    }
}

export async function enviarARevision({
    registroId,
    solicitanteId,
    solicitanteRol,
    revisorId,
    aprobadorId,
    comentario
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const resultadoRegistro = await client.query(
            `SELECT
                r.id,
                r.nombre,
                r.estado,
                r.proceso_id,
                r.responsable_id,
                r.creado_por,
                p.responsable_id AS responsable_proceso_id
            FROM registros r
            JOIN procesos p
                ON p.id = r.proceso_id
            WHERE r.id = $1
            FOR UPDATE OF r`,
            [registroId]
        );

        const registro = resultadoRegistro.rows[0];

        if (!registro) {
            throw crearError(
                'El registro no existe.',
                404
            );
        }

        const puedeEnviar =
            solicitanteRol === 'admin_general' ||
            registro.creado_por === solicitanteId ||
            registro.responsable_id === solicitanteId ||
            registro.responsable_proceso_id === solicitanteId;

        if (!puedeEnviar) {
            throw crearError(
                'No tienes permiso para enviar este registro.',
                403
            );
        }

        if (registro.estado !== 'borrador') {
            throw crearError(
                'Solo se pueden enviar registros en borrador.',
                409
            );
        }

        const solicitudActiva = await client.query(
            `SELECT id
            FROM solicitudes
            WHERE registro_id = $1
                AND estado IN (
                    'pendiente',
                    'en_responsable',
                    'en_revisor',
                    'en_aprobador'
                )
            LIMIT 1`,
            [registroId]
        );

        if (solicitudActiva.rows[0]) {
            throw crearError(
                'Este registro ya tiene una solicitud activa.',
                409
            );
        }

        const responsableValidado =
            await validarParticipante(
                client,
                registro.responsable_id,
                'responsable',
                true
            );

        const revisorValidado =
            await validarParticipante(
                client,
                revisorId,
                'revisor'
            );

        const aprobadorValidado =
            await validarParticipante(
                client,
                aprobadorId,
                'aprobador',
                true
            );

        const resultadoTipo = await client.query(
            `SELECT id
            FROM tipos_solicitud
            WHERE clave = 'aprobacion_registro'`
        );

        const tipoSolicitudId =
            resultadoTipo.rows[0]?.id;

        if (!tipoSolicitudId) {
            throw crearError(
                'No está configurado el tipo de solicitud para registros.',
                500
            );
        }

        const resultadoSolicitud = await client.query(
            `INSERT INTO solicitudes (
                tipo_solicitud_id,
                registro_id,
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
                $1,
                $2,
                $3,
                $4,
                'en_responsable',
                CURRENT_DATE,
                $5,
                $6,
                $7,
                NOW()
            )
            RETURNING *`,
            [
                tipoSolicitudId,
                registro.id,
                registro.proceso_id,
                solicitanteId,
                responsableValidado,
                revisorValidado,
                aprobadorValidado
            ]
        );

        const solicitud = resultadoSolicitud.rows[0];

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
            [
                solicitud.id,
                solicitanteId,
                comentario ||
                'Registro enviado al flujo de aprobación.'
            ]
        );

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [
                responsableValidado,
                `Tienes el registro "${registro.nombre}" pendiente de revisión.`,
                '/solicitudes'
            ]
        );

        await client.query(
            `UPDATE registros
            SET
                estado = 'en_revision',
                actualizado_en = NOW()
            WHERE id = $1`,
            [registro.id]
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