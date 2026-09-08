ALTER TABLE solicitudes
    DROP CONSTRAINT solicitudes_estado_check;

ALTER TABLE solicitudes
    ADD CONSTRAINT solicitudes_estado_check
    CHECK (
        estado IN (
            'pendiente',
            'en_responsable',
            'en_revisor',
            'en_aprobador',
            'correcciones',
            'aprobada',
            'rechazada',
            'cancelada'
        )
    );