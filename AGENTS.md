<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Stack

- Next.js **16.3.0** with App Router (`app/`), React **19.2.8**, TypeScript strict, Tailwind **v4** (via `@tailwindcss/postcss`, no `tailwind.config.js`).
- Path alias: `@/*` → repo root (`./*`).

## Commands

- `npm run dev` — dev server (regenerates the `<!-- BEGIN:nextjs-agent-rules -->` block above; do not hand-edit it).
- `npm run lint` — only `eslint` is wired up. There is **no `test` and no `typecheck` script**. For a type check run `npx tsc --noEmit` or rely on `next build`.
- `npm run build` — production build (also type-checks).

## MCPs

- **Playwright**: screenshots and any Playwright artifacts go in `.playwright-mcp/` (do not commit).
- **Context7**: use it to fetch current docs for Next.js / React / Tailwind before writing framework code — this Next.js version postdates training data.
- **Supabase**: use for any Supabase task — Database, Auth, Edge Functions, Realtime, Storage, migrations, RLS, logs, advisors, schema changes, and project config. Prefer `list_tables` before schema changes, `get_advisors` after DDL, and local development via the Supabase CLI before pushing to remote. Apply migrations with `apply_migration` (DDL) and run ad-hoc reads with `execute_sql`.

## Skills

Locked in `skills-lock.json`. Load the relevant skill before working in its domain.

- **spec** / **spec-impl**: spec-driven feature design and implementation. Start large features through the `spec` skill instead of coding directly; implement approved specs with `spec-impl`.
- **spec-verifier** subagent: read-only quality review of a spec before implementation. Invoke it with `@spec-verifier <spec-name>` (e.g. `@spec-verifier 01-feed-home`); opencode will generate a task prompt and call the `spec-verifier` subagent. The verifier checks structure, clarity, testable acceptance criteria, inter-section consistency, and the state field ("Approved"/"Aprobado" gate for `spec-impl`), returning an APPROVED/CHANGES_NEEDED verdict. It does NOT modify files nor verify the implementation — only the spec document quality.
- **supabase**: load for ANY task involving Supabase — products (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues), SSR integrations (`supabase-js`, `@supabase/ssr`), auth/sessions/RLS, schema changes, migrations, and debugging errors or logs.
- **supabase-postgres-best-practices**: load BEFORE creating or altering tables/columns, schema design, migrations, RLS policies and tests, indexes, triggers, DB functions, queues (`pg_cron`/`pgmq`), vector search (`pgvector`), or diagnosing slow queries, timeouts, locking, bloat, and connection issues.

## Workflow

- `CLAUDE.md` only contains `@AGENTS.md`; edit guidance here, not there.
- Before any Supabase schema work: `list_tables` to understand existing structure, load the `supabase-postgres-best-practices` skill, and after DDL run `get_advisors` to catch missing RLS/indexes.


## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc, en ingles.
