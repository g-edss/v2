ALTER TABLE usuarios
ADD COLUMN password_hash VARCHAR(255);

CREATE UNIQUE INDEX usuarios_correo_lower_idx
ON usuarios (LOWER(correo));