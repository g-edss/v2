import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import { pool } from './db.js';

const PRIMERA_MIGRACION_AUTOMATICA = 11;
const PATRON_MIGRACION = /^(\d{3})_.+\.sql$/;

async function encontrarDirectorioMigraciones() {
    const candidatos = [
        process.env.MIGRATIONS_DIR,
        path.resolve(process.cwd(), 'database', 'migrations'),
        path.resolve(process.cwd(), '..', 'database', 'migrations'),
    ].filter(Boolean);

    for (const candidato of candidatos) {
        try {
            await access(candidato);
            return candidato;
        } catch {
            // Continúa con la siguiente ubicación posible.
        }
    }

    throw new Error(
        'No se encontró el directorio de migraciones de la base de datos.',
    );
}

async function listarMigracionesPendientes(client, directorio) {
    const archivos = (await readdir(directorio))
        .map((nombre) => {
            const coincidencia = nombre.match(PATRON_MIGRACION);

            return coincidencia
                ? {
                    nombre,
                    numero: Number(coincidencia[1]),
                }
                : null;
        })
        .filter(
            (archivo) =>
                archivo &&
                archivo.numero >= PRIMERA_MIGRACION_AUTOMATICA,
        )
        .sort(
            (a, b) =>
                a.numero - b.numero ||
                a.nombre.localeCompare(b.nombre),
        );

    const { rows } = await client.query(
        `SELECT nombre
        FROM schema_migrations`,
    );

    const aplicadas = new Set(rows.map((fila) => fila.nombre));

    return archivos.filter((archivo) => !aplicadas.has(archivo.nombre));
}

export async function ejecutarMigracionesPendientes() {
    const directorio = await encontrarDirectorioMigraciones();
    const client = await pool.connect();

    try {
        await client.query(
            `SELECT pg_advisory_lock(hashtext('web360_migrations'))`,
        );

        await client.query(
            `CREATE TABLE IF NOT EXISTS schema_migrations (
                nombre VARCHAR(255) PRIMARY KEY,
                aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )`,
        );

        const pendientes = await listarMigracionesPendientes(
            client,
            directorio,
        );

        for (const migracion of pendientes) {
            const ruta = path.join(directorio, migracion.nombre);
            const sql = await readFile(ruta, 'utf8');

            console.log(`Aplicando migración ${migracion.nombre}...`);

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query(
                    `INSERT INTO schema_migrations (nombre)
                    VALUES ($1)`,
                    [migracion.nombre],
                );
                await client.query('COMMIT');
            } catch (error) {
                await client.query('ROLLBACK');
                throw error;
            }

            console.log(`Migración ${migracion.nombre} aplicada.`);
        }

        if (pendientes.length === 0) {
            console.log('Base de datos actualizada; no hay migraciones pendientes.');
        }
    } finally {
        try {
            await client.query(
                `SELECT pg_advisory_unlock(hashtext('web360_migrations'))`,
            );
        } finally {
            client.release();
        }
    }
}
