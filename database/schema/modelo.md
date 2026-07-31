# Modelo de datos — WEB 360 de Calidad

Este documento acompaña a `migrations/001_esquema_inicial.sql`. El esquema es un
**borrador base**: el equipo de base de datos es dueño de refinarlo.

## Cómo aplicar el esquema

Con Docker (recomendado, desde la raíz del repo):

```bash
docker compose up -d          # crea la BD y corre migrations + seeds la 1ª vez
```

Adminer queda disponible en http://localhost:8080
(sistema: PostgreSQL, servidor: `db`, usuario/clave/BD: los del `.env`).

Aplicación manual (sin Docker):

```bash
psql "$DATABASE_URL" -f database/migrations/001_esquema_inicial.sql
psql "$DATABASE_URL" -f database/seeds/001_catalogos.sql
```

## Bloques del modelo

| Bloque        | Tablas                                                             | Diagrama |
|---------------|-------------------------------------------------------------------|----------|
| Acceso        | `roles`, `usuarios`                                               | —        |
| Procesos      | `procesos`, `proceso_usuarios`                                    | 1        |
| Documentos    | `tipos_documento`, `documentos`, `documento_versiones`           | 2, 3     |
| Solicitudes   | `tipos_solicitud`, `solicitudes`, `solicitud_historial`          | 5        |
| Auditorías    | `auditorias`, `hallazgos`, `acciones_correctivas`                | 4        |
| Juntas        | `juntas`, `junta_asistentes`, `minutas`, `compromisos`, `compromiso_avances` | 6 |
| Transversal   | `notificaciones`                                                 | todos    |

## Convención de migraciones

- Un archivo por cambio, numerado: `002_...`, `003_...`, siempre incremental.
- Nunca editar una migración ya aplicada en `main`; crear una nueva.
- Cada migración debe poder correrse una sola vez y en orden.

## Puntos abiertos (ver anexo de diagramas)

- Formato del código institucional del documento (`documentos.codigo`).
- Criterio que resuelve las etapas "si aplica" de las solicitudes.
- Quién ejecuta el cierre de la auditoría.
