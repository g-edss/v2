import { pool } from '../config/db.js';

function crearError(mensaje, status = 500) {
    const error = new Error(mensaje);
    error.status = status;
    error.publico = mensaje;

    return error;
}

function obtenerUsuarioAsignado(solicitud) {
    const usuariosPorEstado = {
        en_responsable:
            solicitud.responsable_asignado_id,
        en_revisor:
            solicitud.revisor_asignado_id,
        en_aprobador:
            solicitud.aprobador_asignado_id,
    };

    return usuariosPorEstado[solicitud.estado] || null;
}

function validarUsuarioAsignado(
    solicitud,
    usuarioId,
) {
    const usuarioAsignado =
        obtenerUsuarioAsignado(solicitud);

    if (
        !usuarioAsignado ||
        Number(usuarioAsignado) !== Number(usuarioId)
    ) {
        throw crearError(
            'Esta solicitud no está asignada al usuario actual.',
            403,
        );
    }
}

export async function listarSolicitudes({
    usuarioId,
    rol
}) {
    const { rows } = await pool.query(
        `SELECT
            s.id,
            s.estado,
            s.creado_en,
            s.documento_id,
            s.version_documento_id,
            s.registro_id,
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
            u.nombre AS solicitante,
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
        [usuarioId, rol]
    );

    return rows;
}

export async function avanzarSolicitud({
    solicitudId,
    usuarioId,
    comentario,
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

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
            throw crearError(
                'La solicitud no existe.',
                404,
            );
        }

        let estadoSiguiente;
        let destinatarioSiguiente;

        if (solicitud.estado === 'en_responsable') {
            if (
                Number(solicitud.responsable_asignado_id) !==
                Number(usuarioId)
            ) {
                throw crearError(
                    'Esta solicitud no está asignada al usuario actual.',
                    403,
                );
            }

            if (solicitud.revisor_asignado_id) {
                estadoSiguiente = 'en_revisor';
                destinatarioSiguiente =
                    solicitud.revisor_asignado_id;
            } else {
                estadoSiguiente = 'en_aprobador';
                destinatarioSiguiente =
                    solicitud.aprobador_asignado_id;
            }
        } else if (solicitud.estado === 'en_revisor') {
            if (
                Number(solicitud.revisor_asignado_id) !==
                Number(usuarioId)
            ) {
                throw crearError(
                    'Esta solicitud no está asignada al usuario actual.',
                    403,
                );
            }

            estadoSiguiente = 'en_aprobador';
            destinatarioSiguiente =
                solicitud.aprobador_asignado_id;
        } else {
            throw crearError(
                'La solicitud no está en una etapa intermedia.',
                409,
            );
        }

        if (!destinatarioSiguiente) {
            throw crearError(
                'La siguiente etapa no tiene un usuario asignado.',
                409,
            );
        }

        await client.query(
            `UPDATE solicitudes
            SET estado = $1,
                actualizado_en = now()
            WHERE id = $2`,
            [
                estadoSiguiente,
                solicitud.id,
            ],
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
                comentario ||
                'La solicitud avanzó a la siguiente etapa.',
            ],
        );

        const tipoElemento = solicitud.registro_id
            ? 'registro'
            : 'documento';

        const mensajeNotificacion =
            estadoSiguiente === 'en_revisor'
                ? `Tienes un ${tipoElemento} pendiente de revisión.`
                : `Tienes un ${tipoElemento} pendiente de aprobación.`;

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [
                destinatarioSiguiente,
                mensajeNotificacion,
                '/solicitudes',
            ],
        );

        await client.query('COMMIT');

        return {
            ...solicitud,
            estado: estadoSiguiente,
        };

    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function aprobarSolicitud({
    solicitudId,
    usuarioId,
    comentario,
    codigo
}) {
    const codigoNormalizado =
        String(codigo || '').trim().toUpperCase();

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `SELECT
                s.id,
                s.estado,
                s.documento_id,
                s.version_documento_id,
                s.registro_id,
                s.aprobador_asignado_id,
                d.elaborador_id,
                registro.creado_por AS registro_creado_por
            FROM solicitudes s
            LEFT JOIN documentos d
                ON d.id = s.documento_id
            LEFT JOIN registros registro
                ON registro.id = s.registro_id
            WHERE s.id = $1
            FOR UPDATE OF s`,
            [solicitudId]
        );

        const solicitud = rows[0];

        if (!solicitud) {
            throw crearError(
                'La solicitud no existe.',
                404
            );
        }

        if (solicitud.estado !== 'en_aprobador') {
            throw crearError(
                'La solicitud ya fue atendida o no está lista para aprobar.',
                409
            );
        }

        if (
            Number(solicitud.aprobador_asignado_id) !==
            Number(usuarioId)
        ) {
            throw crearError(
                'Esta solicitud no está asignada al usuario actual.',
                403
            );
        }

        const esRegistro =
            solicitud.registro_id !== null;

        if (
            !esRegistro &&
            !codigoNormalizado
        ) {
            throw crearError(
                'Debes asignar el código institucional.',
                400
            );
        }

        if (codigoNormalizado.length > 60) {
            throw crearError(
                'El código debe tener máximo 60 caracteres.',
                400
            );
        }

        if (esRegistro) {
            await client.query(
                `UPDATE registros
                SET
                    estado = 'aprobado',
                    actualizado_en = NOW()
                WHERE id = $1`,
                [solicitud.registro_id]
            );
        } else {
            await client.query(
                `UPDATE documento_versiones
                SET vigente = (id = $2)
                WHERE documento_id = $1`,
                [
                    solicitud.documento_id,
                    solicitud.version_documento_id
                ]
            );

            await client.query(
                `UPDATE documentos
                SET
                    estado = 'vigente',
                    codigo = $2
                WHERE id = $1`,
                [
                    solicitud.documento_id,
                    codigoNormalizado
                ]
            );
        }

        await client.query(
            `UPDATE solicitudes
            SET
                estado = 'aprobada',
                actualizado_en = NOW()
            WHERE id = $1`,
            [solicitud.id]
        );

        const comentarioHistorial =
            comentario ||
            (
                esRegistro
                    ? 'Registro aprobado sin observaciones.'
                    : 'Documento aprobado sin observaciones.'
            );

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
            [
                solicitud.id,
                usuarioId,
                comentarioHistorial
            ]
        );

        const destinatario = esRegistro
            ? solicitud.registro_creado_por
            : solicitud.elaborador_id;

        const mensajeNotificacion = esRegistro
            ? 'Tu registro fue aprobado.'
            : 'Tu documento fue aprobado y publicado.';

        const enlaceNotificacion = esRegistro
            ? '/almacen-registros'
            : '/visor-documental';

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [
                destinatario,
                mensajeNotificacion,
                enlaceNotificacion
            ]
        );

        await client.query('COMMIT');

        return {
            ...solicitud,
            estado: 'aprobada',
            es_registro: esRegistro
        };
    } catch (error) {
        await client.query('ROLLBACK');

        if (
            error.code === '23505' &&
            error.constraint === 'documentos_codigo_key'
        ) {
            throw crearError(
                'Ya existe un documento con ese código institucional.',
                409
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
    comentario
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `SELECT
                s.id,
                s.estado,
                s.documento_id,
                s.version_documento_id,
                s.registro_id,
                s.responsable_asignado_id,
                s.revisor_asignado_id,
                s.aprobador_asignado_id,
                d.elaborador_id,
                registro.creado_por AS registro_creado_por
            FROM solicitudes s
            LEFT JOIN documentos d
                ON d.id = s.documento_id
            LEFT JOIN registros registro
                ON registro.id = s.registro_id
            WHERE s.id = $1
            FOR UPDATE OF s`,
            [solicitudId]
        );

        const solicitud = rows[0];

        if (!solicitud) {
            throw crearError(
                'La solicitud no existe.',
                404
            );
        }

        if (
            ![
                'en_responsable',
                'en_revisor',
                'en_aprobador'
            ].includes(solicitud.estado)
        ) {
            throw crearError(
                'La solicitud ya fue atendida o no está lista.',
                409
            );
        }

        validarUsuarioAsignado(
            solicitud,
            usuarioId
        );

        if (!comentario) {
            throw crearError(
                'Debes explicar qué correcciones se requieren.',
                400
            );
        }

        const esRegistro =
            solicitud.registro_id !== null;

        await client.query(
            `UPDATE solicitudes
            SET
                estado = 'correcciones',
                actualizado_en = NOW()
            WHERE id = $1`,
            [solicitud.id]
        );

        if (esRegistro) {
            await client.query(
                `UPDATE registros
                SET
                    estado = 'correcciones',
                    actualizado_en = NOW()
                WHERE id = $1`,
                [solicitud.registro_id]
            );
        } else {
            await client.query(
                `UPDATE documentos
                SET estado = 'borrador'
                WHERE id = $1`,
                [solicitud.documento_id]
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
            [
                solicitud.id,
                usuarioId,
                comentario
            ]
        );

        const destinatario = esRegistro
            ? solicitud.registro_creado_por
            : solicitud.elaborador_id;

        const mensajeNotificacion = esRegistro
            ? `El registro requiere correcciones: ${comentario}`
            : `El documento requiere correcciones: ${comentario}`;

        const enlaceNotificacion = esRegistro
            ? '/almacen-registros'
            : '/solicitudes';

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [
                destinatario,
                mensajeNotificacion,
                enlaceNotificacion
            ]
        );

        await client.query('COMMIT');

        return {
            ...solicitud,
            estado: 'correcciones',
            es_registro: esRegistro
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function rechazarSolicitud({
    solicitudId,
    usuarioId,
    comentario
}) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { rows } = await client.query(
            `SELECT
                s.id,
                s.estado,
                s.documento_id,
                s.version_documento_id,
                s.registro_id,
                s.responsable_asignado_id,
                s.revisor_asignado_id,
                s.aprobador_asignado_id,
                d.elaborador_id,
                registro.creado_por AS registro_creado_por
            FROM solicitudes s
            LEFT JOIN documentos d
                ON d.id = s.documento_id
            LEFT JOIN registros registro
                ON registro.id = s.registro_id
            WHERE s.id = $1
            FOR UPDATE OF s`,
            [solicitudId]
        );

        const solicitud = rows[0];

        if (!solicitud) {
            throw crearError(
                'La solicitud no existe.',
                404
            );
        }

        if (
            ![
                'en_responsable',
                'en_revisor',
                'en_aprobador'
            ].includes(solicitud.estado)
        ) {
            throw crearError(
                'La solicitud ya fue atendida o no está lista.',
                409
            );
        }

        validarUsuarioAsignado(
            solicitud,
            usuarioId
        );

        if (!comentario) {
            throw crearError(
                'Debes explicar el motivo del rechazo.',
                400
            );
        }

        const esRegistro =
            solicitud.registro_id !== null;

        await client.query(
            `UPDATE solicitudes
            SET
                estado = 'rechazada',
                actualizado_en = NOW()
            WHERE id = $1`,
            [solicitud.id]
        );

        if (esRegistro) {
            await client.query(
                `UPDATE registros
                SET
                    estado = 'rechazado',
                    actualizado_en = NOW()
                WHERE id = $1`,
                [solicitud.registro_id]
            );
        } else {
            await client.query(
                `UPDATE documentos
                SET estado = 'rechazado'
                WHERE id = $1`,
                [solicitud.documento_id]
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
            [
                solicitud.id,
                usuarioId,
                comentario
            ]
        );

        const destinatario = esRegistro
            ? solicitud.registro_creado_por
            : solicitud.elaborador_id;

        const mensajeNotificacion = esRegistro
            ? `Tu registro fue rechazado: ${comentario}`
            : `Tu documento fue rechazado: ${comentario}`;

        const enlaceNotificacion = esRegistro
            ? '/almacen-registros'
            : '/solicitudes';

        await client.query(
            `INSERT INTO notificaciones (
                usuario_id,
                mensaje,
                enlace
            )
            VALUES ($1, $2, $3)`,
            [
                destinatario,
                mensajeNotificacion,
                enlaceNotificacion
            ]
        );

        await client.query('COMMIT');

        return {
            ...solicitud,
            estado: 'rechazada',
            es_registro: esRegistro
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}