# Frontend — WEB 360 de Calidad

Interfaz en **Vue 3 + Vite** (JavaScript).

## Arranque

```bash
cd frontend
cp .env.example .env
npm install
npm run dev      
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