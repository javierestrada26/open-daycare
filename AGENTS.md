<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Stack

- Next.js **16.3.0** with App Router (`app/`), React **19.2.8**, TypeScript strict, Tailwind **v4** (via `@tailwindcss/postcss`, no `tailwind.config.js`).
- Supabase clients for Next.js (SSR): `@supabase/supabase-js` + `@supabase/ssr` — used to interact with the database, Auth, Realtime, and Storage from the app.
- Path alias: `@/*` → repo root (`./*`).

## Commands

- `npm run dev` — dev server (regenerates the `<!-- BEGIN:nextjs-agent-rules -->` block above; do not hand-edit it).
- `npm run lint` — only `eslint` is wired up. There is **no `test` and no `typecheck` script**. For a type check run `npx tsc --noEmit` or rely on `next build`.
- `npm run build` — production build (also type-checks).

## MCPs

- **Playwright**: screenshots and any Playwright artifacts go in `.playwright-mcp/` (do not commit).
- **Context7**: use it to fetch current docs for Next.js / React / Tailwind before writing framework code — this Next.js version postdates training data.
- **Supabase**: use for any Supabase task — Database, Auth, Edge Functions, Realtime, Storage, migrations, RLS, logs, advisors, schema changes, and project config. Prefer `list_tables` before schema changes, `get_advisors` after DDL, and local development via the Supabase CLI before pushing to remote. Run ad-hoc reads with `execute_sql`; for DDL see the "Reglas de base de datos" section below (migrations are mandatory).

## Skills

Locked in `skills-lock.json`. Load the relevant skill before working in its domain.

- **spec** / **spec-impl**: spec-driven feature design and implementation. Start large features through the `spec` skill instead of coding directly; implement approved specs with `spec-impl`.
- **spec-verifier** subagent: read-only quality review of a spec before implementation. Invoke it with `@spec-verifier <spec-name>` (e.g. `@spec-verifier 01-feed-home`); opencode will generate a task prompt and call the `spec-verifier` subagent. The verifier checks structure, clarity, testable acceptance criteria, inter-section consistency, and the state field ("Approved"/"Aprobado" gate for `spec-impl`), returning an APPROVED/CHANGES_NEEDED verdict. It does NOT modify files nor verify the implementation — only the spec document quality.
- **supabase**: load for ANY task involving Supabase — products (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues), SSR integrations (`supabase-js`, `@supabase/ssr`), auth/sessions/RLS, schema changes, migrations, and debugging errors or logs.
- **supabase-postgres-best-practices**: load BEFORE creating or altering tables/columns, schema design, migrations, RLS policies and tests, indexes, triggers, DB functions, queues (`pg_cron`/`pgmq`), vector search (`pgvector`), or diagnosing slow queries, timeouts, locking, bloat, and connection issues.

## Agents

Subagentes especializados en `.opencode/agents/`. Invócalos con `@<nombre> <argumento>`.

- **@accessibility-checker** `[file path]`: analiza y corrige problemas de accesibilidad WCAG 2.2 AA en archivos web (.tsx, .jsx, .html, .svg, .css). Revisa atributos ARIA, HTML semántico, contraste, focus indicators y más.
- **@db-migrator** `[tabla o sección]`: genera, verifica y aplica migraciones de base de datos. Compara el schema de referencia (`../07-DB-Schema/`) contra la DB real, crea migraciones faltantes en `supabase/migrations/`, y las aplica con `npx supabase db push`.
- **@db-security-auditor** `[tabla o área]`: audita y corrige problemas de seguridad en la base de datos Supabase. Previene fuga de datos entre niños y padres por RLS mal configurado, audita SECURITY DEFINER functions, permisos, views, columnas sensibles y JWT claims. Genera migraciones de corrección.
- **@react-best-practices** `[file/folder] [--dry-run]`: aplica mejores prácticas de React a archivos .tsx/.jsx. Usa Context7 para verificar documentación actual. Analiza hooks, TypeScript y performance. Soporta modo `--dry-run` para solo revisar sin modificar.
- **@spec-verifier** `<NN-slug>`: verifica, corrige y marca los criterios de aceptación de un spec implementado. Usa Context7 para validar patrones Next.js/React/Tailwind, y Playwright con visión para comparar pantallas contra las referencias. Edita el `.md` del spec in-place.

## Clientes de Supabase en la app

La app se conecta a Supabase a través de los paquetes `@supabase/supabase-js` y `@supabase/ssr` (helpers en `utils/supabase/`). Siempre use estos helpers — no instancie clientes Supabase a mano.

- `utils/supabase/server.ts` → `createClient(cookieStore)` para **Server Components, Route Handlers y Server Actions**. Pase `await cookies()`. Lanza excepción si se llama fuera de un contexto con cookies.
- `utils/supabase/client.ts` → `createClient()` para **Client Components**. Usa `createBrowserClient` (autogestiona cookies en el navegador).
- `utils/supabase/middleware.ts` → `createClient(request)` helper para **middleware**. Devuelve `{ supabase, supabaseResponse }` para poder refrescar la sesión y devolver la response modificada.
- `middleware.ts` (raíz) → invoca el helper de middleware y llama `supabase.auth.getUser()` en cada request para mantener la sesión fresca. El matcher excluye `_next/static`, `_next/image`, `favicon.ico` y `public/`.

**Variables de entorno** (`.env.local`, no se commitea — cubierto por `.gitignore` `.env*`):
- `NEXT_PUBLIC_SUPABASE_URL` — URL del proyecto.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key (formato `sb_publishable_...`). Prefiera esta sobre la legacy anon key.

**Convenciones:**
- Para leer/escribir datos use el cliente que corresponda al runtime (server vs browser). Nunca use el browser client en el servidor ni viceversa.
- Las cookies de sesión las gestiona `@supabase/ssr` automáticamente vía los helpers — no las manipule a mano.
- El RLS protege los datos; el cliente solo ve lo que el usuario autenticado puede ver. Para verificaciones de Auth use `supabase.auth.getUser()` (server) y `supabase.auth.getClaims()` cuando aplique según la versión de `@supabase/ssr`.
- Los cambios de schema **no** se hacen desde la app — van en migraciones (ver "Reglas de base de datos").

## Workflow

- `CLAUDE.md` only contains `@AGENTS.md`; edit guidance here, not there.
- Before any Supabase schema work: `list_tables` to understand existing structure, load the `supabase-postgres-best-practices` skill, and after DDL run `get_advisors` to catch missing RLS/indexes.


## Reglas de base de datos

- **Todo cambio a la base de datos va en una migración versionada.** NUNCA modifique el schema, datos semilla, RLS, índices, triggers, funciones DB, extensiones ni nada en la base de datos con comandos ad-hoc o llamadas sueltas al MCP `apply_migration`/`execute_sql` (DDL). Cree siempre un archivo en `supabase/migrations/<timestamp>_<nombre>.sql` y aplíquelo con `npx supabase db push`.
- Las migraciones son la **única fuente de verdad** del schema: quedan versionadas en el repo, son repetibles y dan paridad local/remoto. Un cambio aplicado solo en el remoto sin migración es deuda técnica invisible.
- Flujo canónico: `npx supabase migration new <nombre>` → escriba el SQL → `npx supabase db push` → verifique con `supabase list_tables` (MCP, verbose) y `supabase get_advisors` (security + performance).
- `execute_sql` (MCP) es **solo lectura** para verificar (ej. `select`, `information_schema`, `pg_class`, `pg_policies`). No use `execute_sql` para `create`/`alter`/`drop`/`insert`/`update`/`delete` de schema o seed — eso va en una migración.
- `apply_migration` (MCP) es un **fallback de contingencia** únicamente cuando la Supabase CLI no se pueda autenticar/enlazar (sin PAT). Si se usa, registre la decisión en el spec y luego reconcilie el historial remoto con `npx supabase db push` o `migration repair` para evitar drift.
- Antes de tocar schema: cargue la skill `supabase-postgres-best-practices`. Cualquier desviación de sus reglas (ej. PK `uuid` vs `bigint identity`) debe documentarse explícitamente en el spec bajo "Decisiones tomadas y descartadas".
- **Todo spec relacionado con la base de datos debe ir en `specs/database/`.** Esto incluye specs que definan tablas, columnas, relaciones, RLS, índices, triggers, funciones DB, migraciones, seeds, o cualquier cambio de schema. Los specs que no toquen la base de datos van en la raíz de `specs/` o en su subcarpeta correspondiente.


## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc, en ingles.
