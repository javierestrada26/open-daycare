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

## Workflow

- `CLAUDE.md` only contains `@AGENTS.md`; edit guidance here, not there.
- Spec-driven features use the `spec` and `spec-impl` skills (locked in `skills-lock.json`). Start large features through the spec skill instead of coding directly.
- **spec-verifier** subagent: read-only quality review of a spec before implementation. Invoke it with `@spec-verifier <spec-name>` (e.g. `@spec-verifier 01-feed-home`); opencode will generate a task prompt and call the `spec-verifier` subagent. The verifier checks structure, clarity, testable acceptance criteria, inter-section consistency, and the state field ("Approved"/"Aprobado" gate for `spec-impl`), returning an APPROVED/CHANGES_NEEDED verdict. It does NOT modify files nor verify the implementation — only the spec document quality.


## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc, en ingles.