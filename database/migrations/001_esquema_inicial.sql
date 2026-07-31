-- ============================================================
--  WEB 360 de Calidad  |  Migración 001 — Esquema inicial
--  Borrador base para el equipo de base de datos.
--  Modela los seis procesos documentados. Ajustar libremente.
-- ============================================================

-- ---------- Roles y usuarios ----------
CREATE TABLE roles (
    id          SERIAL PRIMARY KEY,
    clave       VARCHAR(40)  NOT NULL UNIQUE,   -- admin_general, responsable, revisor, aprobador, visor, auditor
    nombre      VARCHAR(80)  NOT NULL
);

CREATE TABLE usuarios (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(120) NOT NULL,
    correo      VARCHAR(160) NOT NULL UNIQUE,
    puesto      VARCHAR(120),
    rol_id      INTEGER NOT NULL REFERENCES roles(id),
    activo      BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Procesos (Diagrama 1) ----------
CREATE TABLE procesos (
    id            SERIAL PRIMARY KEY,
    nombre        VARCHAR(160) NOT NULL,
    responsable_id INTEGER NOT NULL REFERENCES usuarios(id),
    correo        VARCHAR(160) NOT NULL,
    descripcion   TEXT,
    estatus       VARCHAR(20) NOT NULL DEFAULT 'activo'
                  CHECK (estatus IN ('activo','inactivo')),
    creado_por    INTEGER NOT NULL REFERENCES usuarios(id),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Usuarios relacionados a un proceso (para autocompletar en solicitudes de cambio)
CREATE TABLE proceso_usuarios (
    proceso_id  INTEGER NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (proceso_id, usuario_id)
);

-- ---------- Catálogo de tipos de documento (editable) ----------
CREATE TABLE tipos_documento (
    id      SERIAL PRIMARY KEY,
    nombre  VARCHAR(120) NOT NULL UNIQUE,
    activo  BOOLEAN NOT NULL DEFAULT TRUE
);

-- ---------- Documentos y versiones (Diagramas 2 y 3) ----------
CREATE TABLE documentos (
    id                 SERIAL PRIMARY KEY,
    codigo             VARCHAR(60) UNIQUE,          -- lo asigna el Aprobador al publicar
    nombre             VARCHAR(200) NOT NULL,
    tipo_documento_id  INTEGER NOT NULL REFERENCES tipos_documento(id),
    origen             VARCHAR(10) NOT NULL CHECK (origen IN ('interno','externo')),
    estado             VARCHAR(10) NOT NULL DEFAULT 'activo'
                       CHECK (estado IN ('activo','inactivo')),
    elaborador_id      INTEGER NOT NULL REFERENCES usuarios(id),
    proceso_id         INTEGER REFERENCES procesos(id),
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE documento_versiones (
    id             SERIAL PRIMARY KEY,
    documento_id   INTEGER NOT NULL REFERENCES documentos(id) ON DELETE CASCADE,
    version        VARCHAR(20) NOT NULL,
    archivo_url    TEXT NOT NULL,                  -- Word / PDF / Excel
    vigente        BOOLEAN NOT NULL DEFAULT FALSE, -- solo una vigente a la vez por documento
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (documento_id, version)
);

-- ---------- Solicitudes (Diagrama 5, flujo general) ----------
CREATE TABLE tipos_solicitud (
    id      SERIAL PRIMARY KEY,
    clave   VARCHAR(30) NOT NULL UNIQUE,   -- alta, cambio, baja, aprobacion_registro
    nombre  VARCHAR(80) NOT NULL
);

CREATE TABLE solicitudes (
    id                 SERIAL PRIMARY KEY,
    tipo_solicitud_id  INTEGER NOT NULL REFERENCES tipos_solicitud(id),
    documento_id       INTEGER REFERENCES documentos(id),
    proceso_id         INTEGER REFERENCES procesos(id),
    solicitante_id     INTEGER NOT NULL REFERENCES usuarios(id),
    estado             VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                       CHECK (estado IN ('pendiente','en_responsable','en_revisor',
                                         'en_aprobador','aprobada','rechazada','cancelada')),
    fecha_modificacion DATE,
    creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Bitácora de cada cambio de estado de una solicitud (trazabilidad)
CREATE TABLE solicitud_historial (
    id            SERIAL PRIMARY KEY,
    solicitud_id  INTEGER NOT NULL REFERENCES solicitudes(id) ON DELETE CASCADE,
    estado        VARCHAR(20) NOT NULL,
    actor_id      INTEGER REFERENCES usuarios(id),
    comentario    TEXT,
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Auditorías (Diagrama 4) ----------
CREATE TABLE auditorias (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(200) NOT NULL,
    auditor_id  INTEGER NOT NULL REFERENCES usuarios(id),
    estado      VARCHAR(20) NOT NULL DEFAULT 'planeacion'
                CHECK (estado IN ('planeacion','ejecucion','en_seguimiento','cerrada')),
    creada_por  INTEGER NOT NULL REFERENCES usuarios(id),
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE hallazgos (
    id            SERIAL PRIMARY KEY,
    auditoria_id  INTEGER NOT NULL REFERENCES auditorias(id) ON DELETE CASCADE,
    descripcion   TEXT NOT NULL,
    responsable_id INTEGER NOT NULL REFERENCES usuarios(id),
    estado        VARCHAR(20) NOT NULL DEFAULT 'abierto'
                  CHECK (estado IN ('abierto','en_revision','cerrado')),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE acciones_correctivas (
    id            SERIAL PRIMARY KEY,
    hallazgo_id   INTEGER NOT NULL REFERENCES hallazgos(id) ON DELETE CASCADE,
    descripcion   TEXT NOT NULL,
    estado        VARCHAR(20) NOT NULL DEFAULT 'propuesta'
                  CHECK (estado IN ('propuesta','aceptada','rechazada')),
    creado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Juntas (Diagrama 6) ----------
CREATE TABLE juntas (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(200) NOT NULL,
    responsable_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha          TIMESTAMPTZ,
    estado         VARCHAR(20) NOT NULL DEFAULT 'convocada'
                   CHECK (estado IN ('convocada','reagendada','celebrada','cerrada')),
    creada_por     INTEGER NOT NULL REFERENCES usuarios(id),
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE junta_asistentes (
    junta_id    INTEGER NOT NULL REFERENCES juntas(id) ON DELETE CASCADE,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    PRIMARY KEY (junta_id, usuario_id)
);

CREATE TABLE minutas (
    id         SERIAL PRIMARY KEY,
    junta_id   INTEGER NOT NULL UNIQUE REFERENCES juntas(id) ON DELETE CASCADE,
    contenido  TEXT NOT NULL,
    creado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE compromisos (
    id             SERIAL PRIMARY KEY,
    junta_id       INTEGER NOT NULL REFERENCES juntas(id) ON DELETE CASCADE,
    descripcion    TEXT NOT NULL,
    responsable_id INTEGER NOT NULL REFERENCES usuarios(id),
    estado         VARCHAR(20) NOT NULL DEFAULT 'abierto'
                   CHECK (estado IN ('abierto','en_avance','cerrado')),
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE compromiso_avances (
    id             SERIAL PRIMARY KEY,
    compromiso_id  INTEGER NOT NULL REFERENCES compromisos(id) ON DELETE CASCADE,
    descripcion    TEXT NOT NULL,
    creado_en      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Notificaciones (transversal a todos los flujos) ----------
CREATE TABLE notificaciones (
    id          SERIAL PRIMARY KEY,
    usuario_id  INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    mensaje     TEXT NOT NULL,
    enlace      VARCHAR(200),
    leida       BOOLEAN NOT NULL DEFAULT FALSE,
    creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- Índices de apoyo ----------
CREATE INDEX idx_documentos_tipo       ON documentos(tipo_documento_id);
CREATE INDEX idx_solicitudes_estado    ON solicitudes(estado);
CREATE INDEX idx_hallazgos_auditoria   ON hallazgos(auditoria_id);
CREATE INDEX idx_compromisos_junta     ON compromisos(junta_id);
CREATE INDEX idx_notificaciones_user   ON notificaciones(usuario_id, leida);
