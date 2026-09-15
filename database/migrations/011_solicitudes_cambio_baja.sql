ALTER TABLE solicitudes
    ADD COLUMN IF NOT EXISTS descripcion TEXT;

CREATE TABLE IF NOT EXISTS solicitud_archivos (
    id SERIAL PRIMARY KEY,

    solicitud_id INTEGER NOT NULL
        REFERENCES solicitudes(id)
        ON DELETE CASCADE,

    archivo_url TEXT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_mime VARCHAR(150),
    tamano_bytes BIGINT,

    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_solicitud_archivos_solicitud
    ON solicitud_archivos(solicitud_id);
