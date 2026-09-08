ALTER TABLE documentos
    DROP CONSTRAINT documentos_estado_check;

ALTER TABLE documentos
    ALTER COLUMN estado TYPE VARCHAR(20);

UPDATE documentos
SET estado = CASE
    WHEN estado = 'activo' THEN 'vigente'
    WHEN estado = 'inactivo' THEN 'obsoleto'
    ELSE estado
END;

ALTER TABLE documentos
    ALTER COLUMN estado SET DEFAULT 'borrador';

ALTER TABLE documentos
    ADD CONSTRAINT documentos_estado_check
    CHECK (
        estado IN (
            'borrador',
            'en_revision',
            'vigente',
            'rechazado',
            'obsoleto'
        )
    );

ALTER TABLE documento_versiones
    RENAME COLUMN archivo_url TO archivo_original_url;

ALTER TABLE documento_versiones
    ADD COLUMN archivo_pdf_url TEXT,
    ADD COLUMN nombre_original VARCHAR(255),
    ADD COLUMN tipo_mime VARCHAR(150),
    ADD COLUMN extension_original VARCHAR(20),
    ADD COLUMN tamano_bytes BIGINT,
    ADD COLUMN hash_sha256 CHAR(64),
    ADD COLUMN creado_por INTEGER REFERENCES usuarios(id),
    ADD COLUMN estado_conversion VARCHAR(20)
        NOT NULL DEFAULT 'pendiente',
    ADD COLUMN error_conversion TEXT;

ALTER TABLE documento_versiones
    ADD CONSTRAINT documento_version_tamano_check
    CHECK (
        tamano_bytes IS NULL
        OR tamano_bytes >= 0
    );

ALTER TABLE documento_versiones
    ADD CONSTRAINT documento_version_conversion_check
    CHECK (
        estado_conversion IN (
            'pendiente',
            'procesando',
            'completada',
            'error',
            'no_requerida'
        )
    );

CREATE INDEX idx_documento_versiones_vigente
    ON documento_versiones(documento_id, vigente);

CREATE INDEX idx_documento_versiones_conversion
    ON documento_versiones(estado_conversion);