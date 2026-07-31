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
