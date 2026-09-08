CREATE TABLE mediciones_indicadores (
    id                SERIAL PRIMARY KEY,

    indicador_id      INTEGER NOT NULL
                      REFERENCES indicadores(id) ON DELETE CASCADE,

    fecha_medicion    DATE NOT NULL,
    resultado         NUMERIC(14, 4) NOT NULL,
    observaciones     TEXT,

    capturado_por     INTEGER NOT NULL
                      REFERENCES usuarios(id),

    creado_en         TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en    TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (indicador_id, fecha_medicion)
);

CREATE INDEX idx_mediciones_indicador
    ON mediciones_indicadores(indicador_id);

CREATE INDEX idx_mediciones_fecha
    ON mediciones_indicadores(fecha_medicion);