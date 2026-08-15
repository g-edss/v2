-- ============================================================
--  WEB 360 de Calidad  |  Seed 001 — Catálogos base
--  Datos mínimos para que el sistema arranque.
-- ============================================================

-- Roles del sistema
INSERT INTO roles (clave, nombre) VALUES
    ('admin_general', 'Administrador General'),
    ('responsable',   'Responsable'),
    ('revisor',       'Revisor'),
    ('aprobador',     'Aprobador'),
    ('visor',         'Visor'),
    ('auditor',       'Auditor')
ON CONFLICT (clave) DO NOTHING;

-- Tipos de documento (catálogo editable desde la aplicación)
INSERT INTO tipos_documento (nombre) VALUES
    ('Manual de calidad'),
    ('Procedimiento de trabajo'),
    ('Registro'),
    ('Ayuda visual'),
    ('Instructivo'),
    ('Política')
ON CONFLICT (nombre) DO NOTHING;

-- Tipos de solicitud (Diagrama 5)
INSERT INTO tipos_solicitud (clave, nombre) VALUES
    ('alta',                 'Alta de documento'),
    ('cambio',               'Cambio de documento'),
    ('baja',                 'Baja de documento'),
    ('aprobacion_registro',  'Aprobación de registro')
ON CONFLICT (clave) DO NOTHING;

-- Usuario administrador inicial (ajustar correo real)
INSERT INTO usuarios (nombre, correo, puesto, rol_id, password_hash)
SELECT 'Administrador', 'admin@fime.uanl.mx', 'Administrador General', r.id, '$2a$10$SPTg9DEylMldW/iNdtYu3ehqgHSnPV70aQOgCfi3/t8bZDvamdQ1u'
FROM roles r WHERE r.clave = 'admin_general'
ON CONFLICT (correo) DO NOTHING;
