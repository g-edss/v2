# Convenciones del proyecto

## Idioma
Código y datos en **español** (nombres de tablas, columnas, variables de dominio).
Palabras clave técnicas quedan en su idioma original.

## Base de datos
- Tablas en plural y minúsculas: `documentos`, `solicitudes`.
- Llaves foráneas: `<entidad>_id` (`responsable_id`).
- Timestamps: `creado_en`, `actualizado_en` (tipo `TIMESTAMPTZ`).
- Estados como texto con `CHECK`, no números mágicos.

## Backend
- Un módulo = trío `*.routes.js` + `*.controller.js` + `*.service.js`.
- El SQL vive en los `services`, nunca en los `controllers`.
- Toda consulta es **parametrizada** (`$1, $2`), nunca concatenada.

## Frontend
- Un archivo `.vue` por componente o vista; `<script setup>`.
- Colores y medidas desde variables CSS (`tokens.css`), no hardcodeadas.
- Componentes reutilizables en `components/`; pantallas completas en `views/`.

## Variables de entorno
Nunca se suben. Se documentan en los `.env.example` y se copian a `.env` local.
