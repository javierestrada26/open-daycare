**State:** Implementado
**Depends on:** SPEC 01, SPEC 03, SPEC 08
**Date:** 2026-08-18

## Objetivo

Implementar autenticación real email+password contra Supabase Auth (sign-in y sign-out) y protección de rutas en el middleware, redirigiendo usuarios sin sesión a `/login` y usuarios autenticados fuera de las pantallas de auth — sin tocar los mocks del Feed ni las RLS policies de `public.users`.

## Alcance

**Incluye**

- Extender `middleware.ts` (raíz) sobre el helper existente `utils/supabase/middleware.ts` con lógica de protección:
  - Protegidas (requieren sesión): `/`, `/kids`, `/kids/[slug]` (todo path no público).
  - Públicas: `/login`, `/activate-account`.
  - Tras `await supabase.auth.getUser()`: si `!user && protegida` → `NextResponse.redirect(new URL('/login', req.url))`; si `user && pública` → redirect a `/`; else devuelve `supabaseResponse`.
  - Matcher sin cambios: `/((?!_next/static|_next/image|favicon.ico|public/).*)`.
  - Las cookies refrescadas en `supabaseResponse` se copian al response de redirect para no perder la sesión.
- Crear `app/_actions/auth.ts` (`'use server'`) con `signIn(formData)` y `signOut()` usando `createClient(await cookies())` de `utils/supabase/server.ts`. `signIn` → `signInWithPassword`, error → `{ error }`, ok → `redirect('/')`. `signOut` → `signOut()` + `redirect('/login')`.
- Modificar `app/login/page.tsx` (sigue `'use client'`): `<form action={signIn}>`, estado `loading` ("Ingresando…" + `disabled`), estado `error` ("Email o contraseña incorrectos" bajo el botón en `--color-primary-dark`). Layout, `<SunMark/>`, panel de marca, inputs, "¿Olvidaste tu contraseña?" (no funcional) y link "Activá tu cuenta" intactos.
- Modificar `app/_components/Sidebar.tsx` (permanece Server Component): envolver el ícono logout en `<form action={signOut}><button type="submit" aria-label="Cerrar sesión">…</button></form>`. Resto del Sidebar (logo, nav, `NewPostModal`, bloque "Caro Giménez") intacto.
- Verificación real: login con seed staff `javier@google.com`/`Abc123456` (SPEC 08, `email_confirmed_at` seteado) redirige a `/`.

**No incluye**

- Activar cuenta / signup con código de invitación (requiere tabla `invitations` inexistente).
- RLS policies sobre `public.users` (van en spec dedicado en `specs/database/`).
- Reemplazar el mock "Caro Giménez" ni los posts del Feed por datos reales.
- Flujo "¿Olvidaste tu contraseña?" (reset por email) — sigue visible-no-funcional.
- Confirmación por email, refresh tokens manuales, OAuth, magic link.
- Toggle de visibilidad de contraseña y validación client-side avanzada.
- Responsive móvil y dark mode.
- Modificar `app/page.tsx`, `app/kids/*`, `app/activate-account/page.tsx`, `app/layout.tsx` ni `utils/supabase/*`.

## Modelo de datos

Sin nuevas tablas ni columnas. Reusa `auth.users` (Supabase Auth) y el seed staff de SPEC 08. **No lee** `public.users` en este spec.

```ts
// app/login/page.tsx
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

```ts
// app/_actions/auth.ts
"use server";
export async function signIn(formData: FormData): Promise<{ error?: string } | void>;
export async function signOut(): Promise<void>;
```

## Plan de implementación

1. **Crear `app/_actions/auth.ts` (`'use server'`):** `signIn` lee `email`/`password` de formData, crea server client con `await cookies()`, llama `signInWithPassword`; error → `{ error: error.message }`, ok → `redirect('/')`. `signOut` → `signOut()` + `redirect('/login')`. Verificar: `npx tsc --noEmit` ok.
2. **Extender `middleware.ts`:** tras `getUser()`, `PUBLIC_ROUTES = ['/login', '/activate-account']`; `isProtected = !PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r+'/'))`. Redirects copiando `supabaseResponse.cookies`. Ver manual: sin sesión `/`, `/kids`, `/kids/mateo-fernandez` → `/login`; con sesión `/login` → `/`.
3. **Modificar `app/login/page.tsx`:** `<form action={signIn}>` con `<button type="submit" disabled={loading}>{loading ? "Ingresando…" : "Iniciar sesión"}</button>`; `{error && <p className="text-primary-dark text-[13.5px]">{error}</p>}` bajo el botón. Ver manual: credenciales inválidas → mensaje, sin redirect; `javier@google.com`/`Abc123456` → `/`.
4. **Modificar `app/_components/Sidebar.tsx`:** `import { signOut } from "@/app/_actions/auth"`; logout → `<form action={signOut}><button type="submit">…</button></form>`. Ver manual: clic → `/login`; luego `/` → `/login`.
5. **Verificar:** `npm run lint`, `npx tsc --noEmit`, `npm run build` sin errores. E2E manual (Playwright opcional): (a) `/` sin sesión → `/login`; (b) login seed → `/`; (c) logout → `/login`; (d) `/login` con sesión → `/`; (e) credenciales malas → inline error. `supabase get_advisors` (security) sin nuevos warnings (cero DDL).

## Criterios de aceptación

- [x] Visitar `/`, `/kids` o `/kids/[slug]` sin sesión redirige a `/login` (middleware, antes de render).
- [x] Visitar `/login` o `/activate-account` con sesión redirige a `/`.
- [x] El matcher excluye `_next/static`, `_next/image`, `favicon.ico`, `public/` (sin regresión).
- [x] Las cookies refrescadas se preservan en los responses de redirect.
- [x] `app/_actions/auth.ts` expone `signIn` y `signOut` (`'use server'`) con `createClient(await cookies())`.
- [x] Login con `javier@google.com`/`Abc123456` redirige a `/` y deja sesión activa.
- [x] Credenciales inválidas NO redirigen: muestran "Email o contraseña incorrectos" y el botón se rehabilita.
- [x] El botón "Iniciar sesión" muestra "Ingresando…" y se deshabilita durante el submit.
- [x] Clic en logout del Sidebar redirige a `/login` y destruye la sesión.
- [x] `app/login/page.tsx` conserva layout dos columnas, `<SunMark/>`, panel de marca, inputs, "¿Olvidaste tu contraseña?" (no funcional) y link "Activá tu cuenta" (sin regresión vs. SPEC 03).
- [x] `app/_components/Sidebar.tsx` permanece Server Component; `NewPostModal` única isla client; bloque "Caro Giménez" y nav intactos.
- [x] "¿Olvidaste tu contraseña?" sigue sin hacer nada.
- [x] Feed y `/kids` siguen mostrando mocks de SPEC 01-02.
- [x] Cero DDL (no se crean/modifican tablas, columnas, RLS, triggers ni migraciones).
- [x] `app/activate-account/page.tsx`, `app/page.tsx`, `app/kids/*`, `app/layout.tsx` y `utils/supabase/*` sin cambios.
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan.

## Decisiones tomadas y descartadas

- **Yes:** protección en `middleware.ts` (extender el existente). Context7 (`/supabase/ssr`, common-patterns) confirma el patrón middleware-first (`getUser()` + rutas protegidas + redirect).
- **No:** guards por Server Component en cada página. Duplica lógica y toca archivos que el spec promete no mover.
- **Yes:** Server Actions con `utils/supabase/server.ts`. Idiomático Next.js 16 + Supabase SSR; cookies server-side; login client sólo para UX.
- **No:** `signIn` client-side con `utils/supabase/client.ts`. Expone el flow al cliente y complica cookies/redirect.
- **Yes:** redirect post-login siempre a `/`. Sin selector de rol (eliminado en SPEC 03); simple y predecible.
- **No:** `returnTo` ni redirect por rol. Sin valor hoy; requeriría leer `public.users` + RLS.
- **Yes:** redirigir autenticados fuera de `/login` y `/activate-account`.
- **Yes:** `signOut` cableado al ícono logout del Sidebar vía `<form action={signOut}>` (Sidebar sigue Server).
- **Yes:** mantener mocks "Caro Giménez" y posts. Auth+protección, no personalización.
- **No:** leer `public.users` para nombre real. Amplía alcance y arrastra RLS.
- **Yes:** diferir RLS policies a spec de DB separado. Cero DDL acá.
- **Yes:** mensaje inline + `loading`. Mínimo UX honesto; reusa `--color-primary-dark` (sin tokens nuevos).
- **No:** validación client-side de formato ni toggle de visibilidad. Sin valor para el login del seed.
- **Yes:** "¿Olvidaste tu contraseña?" sigue no funcional. Reset por email es flujo separado.
- **Yes:** usar el seed staff de SPEC 08 (`email_confirmed_at` seteado → `signInWithPassword` entra sin confirmación).
- **Yes:** copiar cookies de `supabaseResponse` al redirect. Preserva sesión refrescada (recomendación Supabase SSR).

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `NextResponse.redirect()` descarta las cookies refrescadas por `supabaseResponse` | Copiar `supabaseResponse.cookies.getAll()` al response de redirect antes de retornarlo |
| `signInWithPassword` falla si "Confirm email" ON y la cuenta no está confirmada | El seed staff tiene `email_confirmed_at = now()` (SPEC 08); para cuentas futuras confirmar en el spec de signup |
| `redirect()` en Server Action lanza (Next lo trata como redirect, no error) | Comportamiento esperado; el cliente sigue el redirect. Capturar `{ error }` sólo cuando la action retorna |
| Loop de redirects (`/login` ↔ `/`) | Lógica simétrica: hay usuario en pública → `/`; no hay usuario en protegida → `/login`; `/login` sin usuario cae a `supabaseResponse`. Verificar E2E |
| Sidebar (Server) importa `signOut` (`'use server'`) y `NewPostModal` (Client) | Válido en Next.js 16; el `<form action>` no vuelve client al Sidebar |
| Next.js 16.3.0 postdata al training | Antes de implementar, consultar `node_modules/next/dist/docs/` (regla AGENTS.md) y Context7 para Next.js 16; el patrón Supabase SSR ya validado vía Context7 |
| `utils/supabase/server.ts` lanza fuera de contexto con cookies | Las Server Actions corren con cookies disponibles; no llamarlas desde client sin `await cookies()` |

## Qué **no** está en este spec

- Activar cuenta / signup con código de invitación (requiere `invitations`).
- RLS policies sobre `public.users` (van en `specs/database/`).
- Reemplazar mocks "Caro Giménez" ni posts por datos reales.
- "¿Olvidaste tu contraseña?" (reset por email).
- Confirmación por email, refresh tokens, OAuth, magic link.
- Toggle de visibilidad y validación client-side avanzada.
- Responsive móvil y dark mode.
- Modificar `app/page.tsx`, `app/kids/*`, `app/activate-account/page.tsx`, `app/layout.tsx` o `utils/supabase/*`.

Cada uno de esos items, si se aborda, va en su propio spec.
