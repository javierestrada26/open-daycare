# Open Daycare

Aplicación web para la gestión de guarderías (días de guardia, usuarios, habitaciones, invitaciones, etc.), construida con Next.js (App Router), React, TypeScript, Tailwind v4 y Supabase como backend (Base de datos, Auth, Realtime y Storage).

## Stack

- **Next.js 16.3.0** (App Router) + **React 19.2.8** + **TypeScript** (estricto).
- **Tailwind v4** vía `@tailwindcss/postcss` (sin `tailwind.config.js`).
- **Supabase** (`@supabase/supabase-js` + `@supabase/ssr`) para DB, Auth, Realtime y Storage. Helpers en `utils/supabase/`.
- **Resend** para envío de correos.
- Alias de rutas: `@/*` → raíz del repo.

## Requisitos previos

- **Node.js 20+** y **npm**.
- **Docker** (con al menos 7 GB de RAM asignados) — necesario solo para correr el stack local de Supabase.
- **Supabase CLI** (ver instalación abajo).
- Acceso al proyecto de Supabase en https://supabase.com/dashboard con rol **Owner** o **Admin** (necesario para generar tokens y linkear).

## Instalación

```bash
git clone <repo-url>
cd 06-open-daycare
npm install
```

## Variables de entorno

Copia la plantilla y completa los valores:

```bash
cp .env.template .env.local
```

Edita `.env.local` con los valores del dashboard de Supabase (https://supabase.com/dashboard):

| Variable | Descripción | Dónde obtenerla |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase | Dashboard → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_...`) | Dashboard → Project Settings → API → Project API keys |
| `SUPABASE_DB_PASSWORD` | Contraseña de la base de datos | La que definiste al crear el proyecto |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (solo servidor) | Dashboard → Project Settings → API → Project API keys |
| `RESEND_API_KEY` | API key de Resend | https://resend.com/api-keys |
| `RESEND_FROM` | Email remitente | Ej: `OpenDayCare <onboarding@resend.dev>` |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | `http://localhost:3000` en local |

> `.env.local` está ignorado por git (`.gitignore` cubre `.env*`). No commitear secrets.

## Supabase CLI — autenticación y linkeo del proyecto

El proyecto usa el **Supabase MCP** (Model Context Protocol) y la **Supabase CLI** para migraciones, stack local y deploy. Todo cambio de schema debe ir en una migración versionada (ver [Reglas de base de datos](#reglas-de-base-de-datos)).

### 1. Instalar la CLI

```bash
# npm (requiere Node 20+) — recomendado usar npx
npx supabase --version

# o como dependencia de desarrollo del proyecto
npm install supabase --save-dev

# Windows (alternativa global recomendada por Supabase)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

> No se soporta `npm install -g supabase`.

### 2. Autenticarse (login)

Cada miembro del equipo debe autenticarse con su propio **personal access token**.

1. Genera un access token en: **https://supabase.com/dashboard/account/tokens** (Dashboard → Account → Access Tokens).
2. Ejecuta el login:

   ```bash
   npx supabase login
   ```

   La CLI abre el navegador para generar el token, lo guarda de forma segura en el almacenamiento de credenciales del SO y lo usa para todos los comandos posteriores. Si no hay almacenamiento nativo, cae a `~/.supabase/access-token`.

**Entornos no interactivos / CI:** en lugar de `supabase login`, define las variables de entorno:

```bash
export SUPABASE_ACCESS_TOKEN=...   # tu personal access token
export SUPABASE_DB_PASSWORD=...    # contraseña de la DB del proyecto
export SUPABASE_PROJECT_ID=...      # project ref (ver abajo)
```

### 3. Linkear el proyecto local al remoto

Consigue el **project ref** desde la URL del dashboard: `https://supabase.com/dashboard/project/<project-ref>` (la parte `<project-ref>`).

```bash
npx supabase link --project-ref <project-ref>
```

Esto asocia el repo local con el proyecto remoto y te pedirá la contraseña de la DB. El linkeo le dice a la CLI qué proyecto remoto usar para `db pull`, `db push` y otras operaciones remotas.

## Levantar el proyecto en local

### Solo la app (Next.js)

Asegúrate de tener `.env.local` configurado y luego:

```bash
npm run dev
```

Abre http://localhost:3000.

### Stack completo de Supabase en local (opcional, para DB/Auth local)

Requiere **Docker** corriendo.

```bash
npx supabase start    # descarga imágenes la 1ra vez, levanta todos los servicios
```

Esto aplica migraciones + seed y expone servicios locales:

| Servicio | URL local |
|---|---|
| API gateway | http://127.0.0.1:54321 |
| Supabase Studio | http://127.0.0.1:54323 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |
| Email testing (Inbucket) | http://127.0.0.1:54324 |

Detener con `npx supabase stop` (los datos persisten hasta un `db reset`).

> Cuando uses el stack local, apunta tus variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` a los valores locales que muestra `supabase start`.

## Reglas de base de datos

- **Todo cambio de schema va en una migración versionada.** Nunca modifies la DB con comandos ad-hoc ni con el MCP `apply_migration`/`execute_sql` (DDL).
- Flujo canónico:

  ```bash
  npx supabase migration new <nombre>          # crea supabase/migrations/<timestamp>_<nombre>.sql
  # ...escribe el SQL...
  npx supabase db reset                         # aplica migrations + seed en local
  npx supabase db push --dry-run               # previsualiza qué se aplicará al remoto
  npx supabase db push                          # aplica migrations pendientes al remoto
  ```

- `execute_sql` (MCP) es **solo lectura** para verificar. `apply_migration` (MCP) es un fallback de contingencia cuando la CLI no se pueda autenticar.

## Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (regenera el bloque `nextjs-agent-rules` en `AGENTS.md`). |
| `npm run build` | Build de producción (también hace type-check). |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | Type-check sin generar archivos (no hay script `typecheck`). |

## Estructura del proyecto

```
.
├── app/                 # App Router de Next.js (rutas, layouts, páginas)
├── utils/
│   └── supabase/        # Helpers de cliente (server, client, middleware)
├── middleware.ts        # Refresca la sesión en cada request
├── supabase/
│   ├── config.toml      # Config del stack local
│   └── migrations/      # Migraciones versionadas (fuente de verdad del schema)
├── specs/               # Specs de features (spec-driven development)
├── references/          # Material de referencia
└── AGENTS.md            # Guía para agentes de IA (stack, reglas, workflow)
```

## Notas

- Los clientes de Supabase se instancian **solo** vía los helpers en `utils/supabase/` (server, client y middleware) — no crear clientes a mano.
- Las cookies de sesión las gestiona `@supabase/ssr` automáticamente.
- El RLS protege todos los datos: el cliente solo ve lo que el usuario autenticado puede ver.
- Para verificar Auth en servidor usa `supabase.auth.getUser()`.

## Recursos

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Supabase CLI — Getting started](https://supabase.com/docs/guides/local-development/cli/getting-started)
- [Supabase CLI — Local development workflow](https://supabase.com/docs/guides/local-development/cli-workflows)
- [Supabase — Database migrations](https://supabase.com/docs/guides/local-development/database-migrations)
- [Supabase — Managing environments (CI)](https://supabase.com/docs/guides/deployment/managing-environments)
