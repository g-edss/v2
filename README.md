<<<<<<< HEAD
# Frontend — WEB 360 de Calidad

Interfaz en **Vue 3 + Vite** (JavaScript). Diseño inspirado en QualityWeb 360
con el verde institucional de FIME.

## Arranque

```bash
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

Funciona **sin backend**: las vistas usan datos de ejemplo (`src/api/mock.js`).
Cuando el API esté listo, cada vista cambia el mock por `api.get(...)`.

## Estructura

```
src/
├── main.js              # arranque de la app
├── App.vue
├── router/              # rutas + guarda de sesión
├── stores/              # estado global (Pinia) — auth de ejemplo
├── layouts/             # DefaultLayout: sidebar + topbar + contenido
├── components/          # Sidebar, Topbar, BaseCard, StatusBadge, AppIcon
├── views/               # una vista por módulo (Inicio, Procesos, Documentos…)
├── api/                 # client.js (fetch) + mock.js (datos de ejemplo)
└── assets/styles/       # tokens.css (colores) + main.css (base)
```

## Color institucional

Todo el verde vive en **`src/assets/styles/tokens.css`**, variables `--brand-*`.
Para fijar el verde exacto de FIME, se cambian solo esas variables y toda la
interfaz se actualiza.

## Por qué Vue

Curva de aprendizaje suave, componentes de un solo archivo (`.vue`) fáciles de
repartir en equipo, y excelente integración con Vite. Encaja mejor que HTML
plano para una app con varios módulos y estados.
=======
# WEB 360 de Calidad

Sistema interno de gestión documental y de procesos de calidad para la
**Facultad de Ingeniería Mecánica y Eléctrica (FIME · UANL)**.

Monorepo con tres partes que se desarrollan en paralelo:

```
web360-calidad/
├── frontend/     Interfaz de usuario — Vue 3 + Vite (JavaScript)
├── backend/      API REST — Node + Express, conecta a PostgreSQL
├── database/     Esquema y datos semilla (SQL) para PostgreSQL
├── docs/         Arquitectura, flujo de Git y convenciones
└── docker-compose.yml   Levanta PostgreSQL + Adminer en local
```

## Requisitos

- Node.js 20 o superior
- Docker y Docker Compose (para la base de datos local)

## Puesta en marcha rápida

```bash
# 1) Copiar variables de entorno
cp .env.example .env

# 2) Base de datos (crea la BD y corre migraciones + seeds la primera vez)
docker compose up -d
#    Adminer (visor de la BD): http://localhost:8080

# 3) Backend
cd backend && cp .env.example .env && npm install && npm run dev
#    API en http://localhost:3000

# 4) Frontend (en otra terminal)
cd frontend && cp .env.example .env && npm install && npm run dev
#    App en http://localhost:5173
```

> El frontend funciona **sin backend**: usa datos de ejemplo hasta que el API
> esté conectado. Así el maquetado avanza sin esperar a la base de datos.

## Reparto de trabajo y ramas

Ver **`docs/FLUJO-GIT.md`**. Resumen:

- `main` estable · `develop` integración.
- Ramas por área: `feature/db-*`, `feature/back-*`, `feature/front-*`.
- Sugerencia de arranque:
  - Base de datos → `feature/db-esquema-inicial` (afinar `database/`).
  - Frontend → `feature/front-maquetado`.
  - API → `feature/back-api-procesos`.

## Diseño

Verde institucional de FIME como color primario, con una estructura de panel
(sidebar + barra superior + módulos) fiel a la idea de QualityWeb 360. Todo el
color se controla desde `frontend/src/assets/styles/tokens.css` (variables
`--brand-*`), listo para fijar el tono exacto de la facultad.

## Documentación

- `docs/ARQUITECTURA.md` — cómo encajan las piezas.
- `docs/FLUJO-GIT.md` — ramas y flujo de trabajo.
- `docs/CONVENCIONES.md` — nombres, estilo y reglas.
- `database/schema/modelo.md` — modelo de datos.
>>>>>>> de8c7fc (chore: estructura base del proyecto)
