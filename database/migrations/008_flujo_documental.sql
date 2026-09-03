ALTER TABLE solicitudes
    ADD COLUMN version_documento_id INTEGER
        REFERENCES documento_versiones(id),
    ADD COLUMN responsable_asignado_id INTEGER
        REFERENCES usuarios(id),
    ADD COLUMN revisor_asignado_id INTEGER
        REFERENCES usuarios(id),
    ADD COLUMN aprobador_asignado_id INTEGER
        REFERENCES usuarios(id);

CREATE INDEX idx_solicitudes_version_documento
    ON solicitudes(version_documento_id);

CREATE INDEX idx_solicitudes_responsable_asignado
    ON solicitudes(responsable_asignado_id, estado);

CREATE INDEX idx_solicitudes_revisor_asignado
    ON solicitudes(revisor_asignado_id, estado);

CREATE INDEX idx_solicitudes_aprobador_asignado
    ON solicitudes(aprobador_asignado_id, estado);