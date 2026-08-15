# Arquitectura — WEB 360 de Calidad

## Vista general

Monorepo con tres piezas independientes que se comunican por un contrato HTTP:

```
┌─────────────┐     HTTP /api     ┌─────────────┐     SQL    ┌──────────────┐
│  frontend   │ ───────────────▶  │   backend   │ ─────────▶ │  PostgreSQL  │
│  Vue + Vite │                   │   Express   │            │              │
└─────────────┘                   └─────────────┘            └──────────────┘
                                    API / lógica                 BD
```

- **frontend/** — interfaz Vue.
- **backend/** — traduce peticiones HTTP en consultas a la base. Capas
  `routes → controllers → services → db`.
- **database/** — esquema y datos semilla en SQL puro (sin ORM).


## Stack

| Capa      | Herramienta            |
|-----------|------------------------|
| Front     | Vue 3 + Vite (JS)      |
| Interacción| JavaScript            |
| Backend   | Node + Express         |
| BD        | PostgreSQL             |
| Local     | Docker Compose         |

## Puesta en marcha (orden recomendado)

1. `docker compose up -d` — base de datos + Adminer.
2. `cd backend && npm install && npm run dev`.
3. `cd frontend && npm install && npm run dev`.
