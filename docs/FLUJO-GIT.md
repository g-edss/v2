# Flujo de trabajo con Git

Estrategia sencilla pensada para el equipo actual: dos personas en base de datos
y una en frontend.

## Ramas permanentes

| Rama      | Propósito                                                        |
|-----------|-----------------------------------------------------------------|
| `main`    | Estable. Solo recibe merges revisados. **Protegida.**           |
| `develop` | Integración. Aquí converge todo antes de pasar a `main`.        |

## Ramas de trabajo

Se crean **desde `develop`** y se nombran por área:

```
feature/db-<descripcion>       # equipo de base de datos
feature/front-<descripcion>    # frontend
feature/back-<descripcion>     # backend / API
fix/<descripcion>              # correcciones
```

Ejemplos: `feature/db-esquema-auditorias`, `feature/front-modulo-documentos`.

## Ciclo típico

```bash
git checkout develop
git pull
git checkout -b feature/front-modulo-documentos

# ...trabajas y haces commits...
git add .
git commit -m "front: tabla y alta de documentos"
git push -u origin feature/front-modulo-documentos
```

Luego abres un **Pull Request** hacia `develop`. Otro compañero lo revisa y
aprueba antes del merge.

## Reparto inicial sugerido

- `feature/db-esquema-inicial` → afinar `database/migrations` y `seeds`.
- `feature/back-api-procesos` → completar endpoints sobre el esquema.
- `feature/front-maquetado` → módulos de la interfaz (tu parte).

## Mensajes de commit

Prefijo por área + descripción corta en minúsculas:
`front:`, `back:`, `db:`, `docs:`. Ejemplo: `db: agrega tabla compromisos`.
