CREATE TABLE unidades_medida (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(100) NOT NULL UNIQUE,
    simbolo     VARCHAR(20),
    tipo_dato   VARCHAR(20) NOT NULL
                CHECK (tipo_dato IN ('numero', 'porcentaje', 'texto')),
    descripcion TEXT,
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE indicadores (
    id                SERIAL PRIMARY KEY,
    codigo            VARCHAR(30) NOT NULL UNIQUE,
    nombre            VARCHAR(160) NOT NULL,
    descripcion       TEXT NOT NULL,
    proceso_id        INTEGER NOT NULL REFERENCES procesos(id),
    unidad_medida_id  INTEGER NOT NULL REFERENCES unidades_medida(id),

    frecuencia        VARCHAR(20) NOT NULL
                      CHECK (
                          frecuencia IN (
                              'mensual',
                              'trimestral',
                              'semestral',
                              'anual'
                          )
                      ),

    meta_minima       NUMERIC(14, 4),
    meta_maxima       NUMERIC(14, 4),

    sentido           VARCHAR(20) NOT NULL DEFAULT 'rango'
                      CHECK (
                          sentido IN (
                              'mayor_mejor',
                              'menor_mejor',
                              'rango'
                          )
                      ),

    activo            BOOLEAN NOT NULL DEFAULT TRUE,
    creado_por        INTEGER NOT NULL REFERENCES usuarios(id),
    creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CHECK (
        meta_minima IS NULL
        OR meta_maxima IS NULL
        OR meta_minima <= meta_maxima
    )
);

CREATE TABLE indicador_usuarios (
    indicador_id    INTEGER NOT NULL
                    REFERENCES indicadores(id) ON DELETE CASCADE,

    usuario_id      INTEGER NOT NULL
                    REFERENCES usuarios(id) ON DELETE CASCADE,

    puede_capturar  BOOLEAN NOT NULL DEFAULT FALSE,

    PRIMARY KEY (indicador_id, usuario_id)
);

CREATE INDEX idx_indicadores_proceso
    ON indicadores(proceso_id);

CREATE INDEX idx_indicadores_unidad
    ON indicadores(unidad_medida_id);

CREATE INDEX idx_indicadores_activo
    ON indicadores(activo);

CREATE INDEX idx_indicador_usuarios_usuario
    ON indicador_usuarios(usuario_id);