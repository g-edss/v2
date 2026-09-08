CREATE TABLE registros (
  id SERIAL PRIMARY KEY,
  nombre VARCHAR(255) NOT NULL,
  proceso_id INTEGER NOT NULL,
  responsable_id INTEGER NOT NULL,
  fecha_registro DATE NOT NULL,
  estado VARCHAR(30) NOT NULL DEFAULT 'borrador',
  descripcion TEXT,
  archivo_url TEXT,
  nombre_archivo VARCHAR(255),
  tipo_mime VARCHAR(150),
  tamano_bytes BIGINT,
  creado_por INTEGER NOT NULL,
  creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT registros_proceso_fk
    FOREIGN KEY (proceso_id)
    REFERENCES procesos(id),

  CONSTRAINT registros_responsable_fk
    FOREIGN KEY (responsable_id)
    REFERENCES usuarios(id),

  CONSTRAINT registros_creado_por_fk
    FOREIGN KEY (creado_por)
    REFERENCES usuarios(id),

  CONSTRAINT registros_estado_check
    CHECK (
      estado IN (
        'borrador',
        'en_revision',
        'correcciones',
        'aprobado',
        'rechazado',
        'inactivo'
      )
    )
);

ALTER TABLE solicitudes
  ADD COLUMN registro_id INTEGER;

ALTER TABLE solicitudes
  ADD CONSTRAINT solicitudes_registro_fk
    FOREIGN KEY (registro_id)
    REFERENCES registros(id);

CREATE INDEX idx_solicitudes_registro
  ON solicitudes(registro_id);

CREATE INDEX idx_registros_proceso
  ON registros(proceso_id);

CREATE INDEX idx_registros_responsable
  ON registros(responsable_id);

CREATE INDEX idx_registros_estado
  ON registros(estado);