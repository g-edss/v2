INSERT INTO tipos_documento (
    nombre,
    activo
)
VALUES
    ('Formato', TRUE),
    ('Documento externo', TRUE)
ON CONFLICT (nombre)
DO UPDATE SET
    activo = TRUE;