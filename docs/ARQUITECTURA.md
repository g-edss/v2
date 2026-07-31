# Arquitectura — WEB 360 de Calidad

## Vista general

Monorepo con tres piezas independientes que se comunican por un contrato HTTP:

```
┌─────────────┐     HTTP /api     ┌─────────────┐     SQL     ┌──────────────┐
│  frontend   │ ───────────────▶ │   backend   │ ─────────▶ │  PostgreSQL  │
│  Vue + Vite │                   │   Express   │            │              │
└─────────────┘                   └─────────────┘            └──────────────┘
      tu parte                       API / lógica              equipo de BD
```

- **frontend/** — interfaz Vue. No sabe SQL; solo consume `/api`.
- **backend/** — traduce peticiones HTTP en consultas a la base. Capas
  `routes → controllers → services → db`.
- **database/** — esquema y datos semilla en SQL puro (sin ORM).

La separación permite que cada quien trabaje en paralelo sin pisarse: mientras
el backend no exista, el frontend usa datos de ejemplo (`src/api/mock.js`).

## Stack

| Capa      | Herramienta            | Motivo                                        |
|-----------|------------------------|-----------------------------------------------|
| Front     | Vue 3 + Vite (JS)      | Curva suave, componentes repartibles en equipo|
| Interacción| JavaScript            | Según lo definido por el equipo               |
| Backend   | Node + Express         | Ligero, JS de punta a punta                   |
| BD        | PostgreSQL             | Definido por el equipo                        |
| Local     | Docker Compose         | Levanta la BD igual para todos                |

## Puesta en marcha (orden recomendado)

1. `docker compose up -d` — base de datos + Adminer.
2. `cd backend && npm install && npm run dev`.
3. `cd frontend && npm install && npm run dev`.
