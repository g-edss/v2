# Backend — WEB 360 de Calidad

API REST en **Node.js + Express**, conectada a **PostgreSQL** con `pg`.
JavaScript puro (ESM). Estructura en capas: `routes → controllers → services → db`.

> Es un punto de partida. Si el equipo prefiere otro framework, se puede
> reemplazar sin tocar el frontend mientras se respete el contrato `/api`.

## Arranque

```bash
cd backend
cp .env.example .env      # ajustar DATABASE_URL
npm install
npm run dev               # http://localhost:3000
```

Requiere la base de datos arriba (ver `docker compose up -d` en la raíz).

## Estructura

```
src/
├── index.js              # arranca el servidor
├── app.js                # middlewares + montaje de rutas
├── config/db.js          # pool de PostgreSQL
├── routes/               # define endpoints y los liga a un controller
├── controllers/          # traduce HTTP <-> lógica
├── services/             # lógica de negocio + consultas SQL
└── middlewares/          # manejo de errores, (a futuro) auth
```

## Cómo agregar un módulo nuevo

Copiar el trío `procesos.routes.js` / `procesos.controller.js` /
`procesos.service.js`, renombrar (p. ej. `documentos.*`) y montarlo en `app.js`.
