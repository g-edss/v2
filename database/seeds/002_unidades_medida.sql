INSERT INTO unidades_medida (
    nombre,
    simbolo,
    tipo_dato,
    descripcion
)
VALUES
    (
        'Porcentaje',
        '%',
        'porcentaje',
        'Valor expresado como una proporción de cien'
    ),
    (
        'Cantidad',
        NULL,
        'numero',
        'Conteo de elementos, eventos o registros'
    ),
    (
        'Días',
        'días',
        'numero',
        'Duración o tiempo expresado en días'
    ),
    (
        'Horas',
        'h',
        'numero',
        'Duración o tiempo expresado en horas'
    ),
    (
        'Minutos',
        'min',
        'numero',
        'Duración o tiempo expresado en minutos'
    ),
    (
        'Pesos mexicanos',
        'MXN',
        'numero',
        'Importe monetario expresado en pesos mexicanos'
    ),
    (
        'Texto',
        NULL,
        'texto',
        'Resultado cualitativo o descriptivo'
    )
ON CONFLICT (nombre) DO NOTHING;