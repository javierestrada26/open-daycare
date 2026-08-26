**State:** Implementado
**Depends on:** SPEC 03, SPEC 05, SPEC 08, SPEC 09, SPEC 10
**Date:** 2026-08-25

## Objetivo

Implementar la vinculación padre↔niño de punta a punta: crear las tablas `invitations` y `parent_children` (con enums y RLS por rol) vía migración versionada, enviar la invitación por email real con Resend desde una Server Action al pulsar "Enviar invitación" en `LinkParentModal`, y hacer funcional `/activate-account` para que el padre active su cuenta con el código recibido, quede vinculado al niño y entre a `/` con sesión iniciada.

## Alcance

**Incluye**

- Cargar la skill `supabase-postgres-best-practices` antes de escribir el SQL (regla AGENTS.md).
- Migración `supabase/migrations/<timestamp>_create_invitations_parent_children_tables.sql` (vía `npx supabase migration new create_invitations_parent_children_tables` + `npx supabase db push`) que:
  - Crea los enums `public.relationship_type` (`'father','mother','guardian'`) y `public.invitation_status` (`'pending','accepted','expired','cancelled'`).
  - Crea `public.parent_children` fiel al doc de referencia §5: `id uuid PK default gen_random_uuid()`, `parent_id uuid not null references public.users(id) on delete cascade`, `child_id uuid not null references public.children(id) on delete restrict`, `relationship public.relationship_type not null`, `created_at timestamptz not null default now()`, `unique (parent_id, child_id)`. Índices en ambas FKs. RLS `enable` + `force`.
  - Crea `public.invitations` fiel al doc §6: `id`, `child_id` FK→`children` `on delete restrict`, `invited_by` FK→`users` `on delete restrict`, `full_name text not null`, `email text not null`, `relationship`, `code text not null unique`, `status` default `'pending'`, `expires_at timestamptz not null`, `accepted_at` nullable, `created_at` default `now()`. Índice en `child_id`. RLS `enable` + `force`.
  - Crea la función `public.current_user_role()` (`security definer`, `language sql`, mismo patrón que `current_daycare_id()` de SPEC 10) que devuelve el `role` del usuario autenticado. `revoke execute from public, anon`; `grant execute to authenticated`.
  - Policies (`to authenticated`):
    - `invitations_select_staff_same_daycare` (`for select`): `current_user_role() = 'staff'` + `exists (children join rooms donde daycare_id = current_daycare_id())`.
    - `invitations_insert_staff_same_daycare` (`for insert`, `with check`): lo mismo + `invited_by = (select auth.uid())`.
    - `parent_children_select_staff_or_self` (`for select`): `parent_id = (select auth.uid())` O (staff mismo daycare vía `children`→`rooms`).
  - Sin policies `update`/`delete` ni `insert` sobre `parent_children` (los writes de la activación van por service role y bypassan RLS). Sin seed.
- `npm install resend`.
- Env vars nuevas en `.env.local` (archivo de trabajo) y `.env` (mismos valores en ambos, a pedido del usuario), documentadas en `.env.template`: `RESEND_API_KEY`, `RESEND_FROM` (default `"OpenDayCare <onboarding@resend.dev>"`), `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL` (default `http://localhost:3000`).
- Crear `utils/supabase/admin.ts`: `createAdminClient()` con `createClient` de `@supabase/supabase-js` + `SUPABASE_SERVICE_ROLE_KEY` (sin cookies). Solo se importa desde Server Components/Actions — nunca desde `'use client'`.
- Crear `app/_lib/invitations.ts`: `generateInvitationCode()` (5 chars de `ABCDEFGHJKMNPQRSTUVWXYZ23456789` — sin `0/O/1/I/L`), `INVITATION_TTL_DAYS = 7`, `RELATION_TO_DB` (`Mamá→mother`, `Papá→father`, `Tutor/a→guardian`), `buildInvitationEmail({ parentName, childName, code, activationUrl })` (HTML inline: código grande + botón "Activar mi cuenta" + nota de vencimiento, subject "Invitación a OpenDayCare").
- Crear `app/_actions/invitations.ts` (`'use server'`):
  - `sendInvitation({ childId, fullName, email, relationship })`: valida inputs (nombre no vacío, email con formato, relationship válido, childId uuid); normaliza email a minúsculas; rechaza si ya existe invitación `pending` para `(child_id, email)` ("Ya hay una invitación pendiente para este email"); genera código con reintento ante colisión del unique; inserta la invitación con el cliente SSR del usuario (RLS exige staff + mismo daycare, `invited_by = auth.uid()`) y `expires_at = now() + 7 días`; envía el email vía Resend (`RESEND_FROM`, link `${NEXT_PUBLIC_APP_URL}/activate-account?code=${code}`); si el envío falla, borra la fila y devuelve `{ error: "No se pudo enviar el email. Intentá de nuevo." }`. Éxito → `{ code }`.
  - `activateAccount({ code, password })`: con `createAdminClient()` busca la invitación por `code` (join `children`→`rooms` para `daycare_id`, nombre de niño y sala); si no existe o no está `pending` → error; si `expires_at < now()` → la marca `'expired'` y error; valida password mínimo 6 chars; `auth.admin.createUser({ email: invitation.email, password, email_confirm: true, user_metadata: { daycare_id, role: 'parent', full_name: invitation.full_name } })` (el trigger `handle_new_auth_user` de SPEC 08 crea el perfil en `public.users`); error de email ya registrado → `{ error: "Ya existe una cuenta con este email." }`; inserta en `parent_children` (`parent_id` = nuevo user id, `child_id`, `relationship`); marca la invitación `accepted` + `accepted_at = now()`; `signInWithPassword` con el cliente SSR (cookies) y `redirect('/')`.
- Modificar `app/_components/LinkParentModal.tsx`: props `{ kidName, childId }`; submit real a `sendInvitation` con estados `sending` (botón "Enviando…" deshabilitado), `error` (mensaje inline bajo el botón en `--color-primary-dark`) y `success`. La caja CÓDIGO DE INVITACIÓN pre-envío muestra el placeholder "Se genera al enviar la invitación" (sin código falso). En `success` el cuerpo se reemplaza por panel con el código real (`text-[34px] tracking-[7px]`), "Vence en 7 días", "Enviamos la invitación a {email}" y botón "Listo" que cierra y resetea.
- Modificar `app/kids/[slug]/page.tsx`: pasar `childId={c.id}` a `<LinkParentModal>` (única modificación; sigue Server Component).
- Reescribir `app/activate-account/page.tsx` como async Server Component: lee `searchParams.code`; sin `code` o con código inexistente/expirado/ya usado → tarjeta de error clara ("Este link de invitación no es válido o ya fue usado.") con link a `/login`; válido → renderiza el nuevo client component `app/activate-account/ActivateAccountForm.tsx` con props `{ code, email, childName, roomName }`: tarjeta de contexto con niño y sala reales, inputs CÓDIGO y EMAIL read-only pre-llenados, CREAR CONTRASEÑA editable, checkbox de consentimiento visual (no persiste), botón "Activar mi cuenta" → `activateAccount` con estados `loading`/`error` inline. Layout, `<SunMark/>` y estética de SPEC 03 intactos.
- Middleware sin cambios (`/activate-account` ya es pública desde SPEC 09).
- Verificación E2E manual: login staff `javier@google.com` → crear niño → invitar al email dueño de la cuenta Resend (limitación del remitente de prueba) → abrir el link del email en ventana incógnito → activar → cae en `/` con sesión → logout → login del padre funciona.

**No incluye**

- Vincular un hijo adicional a una cuenta de padre ya existente (la activación devuelve error explícito; va en su propio spec).
- Feed filtrado por hijos del padre ni policies de `posts` por rol.
- Reenvío, cancelación ni listado de invitaciones pendientes en la UI; job que marque `expired` en lote (la expiración se evalúa al activar).
- Mostrar los padres vinculados reales en `/kids/[slug]` (la columna PADRES VINCULADOS sigue mostrando "Aún no hay padres vinculados"; requeriría policy de lectura sobre `public.users`).
- Persistir el consentimiento de fotos del checkbox (el schema no tiene consentimiento por padre).
- Flujo "¿Olvidaste tu contraseña?".
- Templates de email con React Email, dominio propio verificado en Resend, ni emails transaccionales futuros (resumen diario, avisos).
- Responsive móvil y dark mode.
- Modificar `app/page.tsx`, `app/kids/page.tsx`, `Sidebar.tsx`, `app/layout.tsx`, `middleware.ts` ni `utils/supabase/server.ts`/`client.ts`/`middleware.ts`.

## Modelo de datos

```sql
-- Enums
create type public.relationship_type as enum ('father', 'mother', 'guardian');
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

-- parent_children (doc §5)
create table public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete restrict,
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);
create index parent_children_parent_id_idx on public.parent_children (parent_id);
create index parent_children_child_id_idx  on public.parent_children (child_id);
alter table public.parent_children enable row level security;
alter table public.parent_children force  row level security;

-- invitations (doc §6)
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children(id) on delete restrict,
  invited_by   uuid not null references public.users(id) on delete restrict,
  full_name    text not null,
  email        text not null,
  relationship public.relationship_type not null,
  code         text not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);
create index invitations_child_id_idx on public.invitations (child_id);
alter table public.invitations enable row level security;
alter table public.invitations force  row level security;

-- Helper: rol del usuario autenticado (bypassa RLS de public.users,
-- mismo patrón que current_daycare_id() de SPEC 10)
create or replace function public.current_user_role()
returns public.user_role
language sql security definer set search_path = public
as $$ select u.role from public.users u where u.id = (select auth.uid()) $$;
revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;

-- Policies
create policy invitations_select_staff_same_daycare on public.invitations
  for select to authenticated
  using (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

create policy invitations_insert_staff_same_daycare on public.invitations
  for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and public.current_user_role() = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

create policy parent_children_select_staff_or_self on public.parent_children
  for select to authenticated
  using (
    parent_id = (select auth.uid())
    or (
      public.current_user_role() = 'staff'
      and exists (
        select 1 from public.children c
        join public.rooms r on r.id = c.room_id
        where c.id = parent_children.child_id
          and r.daycare_id = public.current_daycare_id()
      )
    )
  );
```

```ts
// app/_lib/invitations.ts
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L
const CODE_LENGTH = 5;
const INVITATION_TTL_DAYS = 7;

type RelationUi = "Mamá" | "Papá" | "Tutor/a";
const RELATION_TO_DB = {
  "Mamá": "mother",
  "Papá": "father",
  "Tutor/a": "guardian",
} as const;
```

Estado del modal: `type SendState = "idle" | "sending" | "success" | "error"` + `sentCode`/`errorMessage`. Estado del form de activación: `loading` + `error` (mismo patrón que login de SPEC 09). Datos de dominio persistidos: invitación (`pending` → `accepted`/`expired`), fila de `parent_children`, usuario en `auth.users` + perfil en `public.users` vía trigger (SPEC 08). El checkbox de consentimiento **no** persiste.

## Plan de implementación

1. **Migración DB:** cargar skill `supabase-postgres-best-practices`; `npx supabase migration new create_invitations_parent_children_tables`; escribir el SQL del modelo; `npx supabase db push`. Verificar con MCP: `list_tables` (verbose) muestra ambas tablas; `execute_sql` read-only confirma enums, índices, RLS enable+force y las 3 policies en `pg_policies`; `get_advisors` (security + performance) sin warnings nuevos.
2. **Base de email + admin client:** `npm install resend`; agregar las 4 env vars a `.env.local` y `.env` (mismos valores en ambos) y documentarlas en `.env.template`; crear `utils/supabase/admin.ts` y `app/_lib/invitations.ts`. Verificar: `npx tsc --noEmit` ok.
3. **Server Action `sendInvitation`:** crear `app/_actions/invitations.ts` con la lógica de validación, código, insert y envío Resend. Verificar: `npx tsc --noEmit` ok.
4. **Modal funcional:** modificar `LinkParentModal.tsx` (props, submit, estados, placeholder pre-envío, panel success) y `app/kids/[slug]/page.tsx` (prop `childId`). Ver manual: login staff → `/kids/[slug]` → "Vincular otro padre" → completar → "Enviar invitación" → panel success con código real; fila `pending` en `invitations`; email recibido en la casilla del dueño de la cuenta Resend. Capturas en `.playwright-mcp/`.
5. **Activación:** reescribir `app/activate-account/page.tsx` (Server Component + carga por `?code=` + tarjetas de error) y crear `ActivateAccountForm.tsx`; agregar `activateAccount` a `app/_actions/invitations.ts`. Ver manual: link del email en incógnito → datos reales del niño/sala → crear contraseña → redirect a `/` con sesión; código malo/expirado/usado → tarjeta de error; email ya registrado → error inline.
6. **Verificación final:** `npm run lint`, `npx tsc --noEmit`, `npm run build` sin errores; E2E completo del paso 5 + logout + login del padre; `get_advisors` sin regresiones; confirmar que `/`, `/kids`, `/login` no sufren regresiones.

## Criterios de aceptación

- [x] Existe la migración versionada con enums + 2 tablas + índices + función + 3 policies, aplicada con `npx supabase db push`.
- [x] `supabase list_tables` muestra `invitations` (11 columnas) y `parent_children` (5 columnas) con los tipos del doc de referencia §5-§6.
- [x] RLS `enable` + `force` en ambas tablas; exactamente 3 policies (`invitations_select_staff_same_daycare`, `invitations_insert_staff_same_daycare`, `parent_children_select_staff_or_self`); sin policies `update`/`delete`.
- [x] `current_user_role()` existe, es `security definer`, revoke de `public`/`anon`, grant a `authenticated`.
- [x] `get_advisors` (security + performance) sin warnings nuevos sobre estas tablas.
- [x] `resend` instalado; las 4 env vars (`RESEND_API_KEY`, `RESEND_FROM`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`) están definidas en `.env.local` y `.env` con los mismos valores, y documentadas en `.env.template`.
- [x] `utils/supabase/admin.ts` no es importado por ningún archivo `'use client'`.
- [x] En el modal, la caja de código pre-envío NO muestra un código falso (muestra "Se genera al enviar la invitación").
- [x] "Enviar invitación" con nombre/email válidos crea la invitación `pending` con código de 5 chars del alfabeto definido y `expires_at` a 7 días, envía el email real vía Resend y muestra el panel success con el mismo código.
- [x] El email recibido contiene el código visible y un botón que abre `/activate-account?code=XXXXX`.
- [x] Si Resend falla, no queda fila `pending` huérfana y el modal muestra el error.
- [x] Segunda invitación `pending` al mismo `(child_id, email)` → error "Ya hay una invitación pendiente para este email".
- [x] Un usuario sin rol `staff` no puede insertar invitaciones (RLS lo rechaza).
- [x] `/activate-account?code=<válido>` (incógnito) muestra nombre real del niño y sala; código y email read-only pre-llenados.
- [x] `/activate-account` sin code, o con code inexistente/expirado/ya aceptado → tarjeta de error con link a `/login`.
- [x] Activación exitosa: existe el usuario en `auth.users` (confirmado), su perfil en `public.users` con `role='parent'` y `full_name` de la invitación, la fila en `parent_children` con el relationship correcto, la invitación en `accepted` con `accepted_at`, y el padre queda con sesión en `/`.
- [x] Código expirado: la invitación queda en `expired` y el padre ve la tarjeta de error.
- [x] Email ya registrado → error "Ya existe una cuenta con este email." sin crear vínculo.
- [x] Tras la activación, logout + login del padre con su contraseña funciona (SPEC 09).
- [x] El checkbox de consentimiento togla en UI pero no escribe en la DB.
- [x] La columna PADRES VINCULADOS de `/kids/[slug]` sigue igual ("Aún no hay padres vinculados").
- [x] `npm run lint`, `npx tsc --noEmit` y `npm run build` pasan; `/`, `/kids`, `/login` sin regresiones.

## Decisiones tomadas y descartadas

- **Yes:** un solo spec combinado (a pedido del usuario), ubicado en `specs/database/` por la regla AGENTS.md (toca schema).
- **No:** dos specs separados (DB + app). El usuario eligió entrega única.
- **Yes:** código generado en el server al pulsar "Enviar invitación" (insert + email en una sola action). Sin invitaciones huérfanas al abrir/cerrar el modal; la caja pre-envío muestra placeholder en vez de un código falso.
- **No:** generar el código al abrir el modal (crearía filas `pending` sin email si el staff cierra sin enviar) ni generarlo en el cliente (predecible/inseguro).
- **Yes:** envío desde Next.js con el paquete `resend` en una Server Action (a pedido del usuario).
- **No:** Supabase Edge Function para el envío. El usuario lo descartó; la Server Action convive con las actions existentes.
- **Yes:** remitente vía `RESEND_FROM` con default `OpenDayCare <onboarding@resend.dev>`. Sin hardcodear; el remitente de prueba solo entrega al dueño de la cuenta Resend (suficiente para desarrollo).
- **Yes:** las env vars van en `.env.local` (archivo de trabajo, convención AGENTS.md) y duplicadas en `.env` con los mismos valores (a pedido del usuario); documentadas en `.env.template`.
- **No:** solo `.env` o solo `.env.local`. El usuario pidió explícitamente ambas.
- **Yes:** activación con Server Action + service role (`createAdminClient`): valida código, `admin.createUser({ email_confirm: true, user_metadata })`, inserta `parent_children`, marca `accepted`. Un solo email (el de Resend), sin policies anónimas sobre `invitations`.
- **No:** `signUp` público. Con "Confirm email" ON el padre recibiría dos emails (Resend + confirmación Supabase) y exigiría exponer lectura anónima de `invitations` vía RLS.
- **Yes:** auto-login post-activación (`signInWithPassword` con las credenciales recién creadas) y `redirect('/')` — mismo destino que el login de SPEC 09.
- **No:** redirect a `/login` o pantalla de éxito sin sesión. Fricción extra sin beneficio.
- **Yes:** `/activate-account` como Server Component que carga la invitación por `?code=` y renderiza el form client con datos reales; código y email read-only (el código ya viene validado del link; el email es el de la invitación).
- **No:** página 100% client validando solo al submit. Mostraría datos mock aunque el código fuera inválido.
- **Yes:** email ya registrado → error explícito; vinculación a cuenta existente fuera de alcance.
- **Yes:** checkbox de consentimiento visual sin persistir (el schema guarda `photo_consent` por niño, gestionado por staff; no hay consentimiento por padre).
- **Yes:** código de 5 chars con alfabeto sin `0/O/1/I/L` (legible por teléfono), `expires_at = 7 días` (fiel a "Vence en 7 días" del diseño), reintento ante colisión del unique.
- **Yes:** la expiración se evalúa al activar (marcando `expired` ahí mismo). **No:** cron/job que expire en lote — sin valor hoy.
- **Yes:** si el envío Resend falla, se borra la fila y se devuelve error. No quedan invitaciones `pending` que nunca llegaron.
- **Yes:** RLS staff-only para `invitations` (via nueva `current_user_role()`); `parent_children` legible por staff del daycare o por el propio padre; writes de la activación por service role (sin policy `insert`). Esto resuelve la distinción de rol que SPEC 10 difirió para este spec.
- **No:** policies `update`/`delete` ni reenvío/cancelación — sin UI que las use hoy.
- **Yes:** PADRES VINCULADOS sigue estático. Mostrar padres reales requeriría policy de lectura sobre `public.users` — va con el spec de feed/cuenta.
- **Yes:** PKs `uuid default gen_random_uuid()` por convención del proyecto (SPEC 07/08/10), pese a la recomendación `bigint identity` de la skill.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `onboarding@resend.dev` solo entrega al email dueño de la cuenta Resend | Documentado; el E2E usa ese email como padre invitado. Producción requiere dominio verificado (otro spec). |
| `SUPABASE_SERVICE_ROLE_KEY` filtrada al cliente sería crítico | `admin.ts` solo se importa desde Server Components/Actions; criterio de aceptación explícito; nunca en archivos `'use client'`. |
| `handle_new_auth_user` (SPEC 08) exige `daycare_id`/`role`/`full_name` en metadata o no crea perfil | `activateAccount` los deriva de la invitación (`children`→`rooms`→`daycare_id`) y siempre los pasa. |
| Quien tenga el código ve nombre del niño y sala (página pública) | Aceptado: el código viaja por email al invitado; el dato mostrado es mínimo (nombre + sala). |
| Usuario ya logueado que abre el link de invitación es redirigido a `/` (SPEC 09) | Comportamiento existente; el E2E usa ventana incógnito. Documentado. |
| Colisión de código en el unique | Reintento de generación dentro de la action (máx. 5 intentos) antes de devolver error. |
| `redirect()` en la action lanza `NEXT_REDIRECT` | Esperado en Next; solo se captura `{ error }` cuando la action retorna (mismo patrón que SPEC 09). |
| `npx supabase login`/`link` puede no estar autenticado | Fallback: MCP `apply_migration` con el mismo SQL (registrado en decisions de la implementación) y reconciliación posterior con `db push`/`migration repair`. |
| Next.js 16.3.0 postdata al training | Consultar `node_modules/next/dist/docs/` y Context7 antes de implementar (regla AGENTS.md); patrón `searchParams` async y Resend confirmados vía docs. |

## Qué **no** está en este spec

- Vinculación de un hijo adicional a una cuenta de padre existente.
- Feed por rol / posts filtrados por hijos; mostrar padres reales en `/kids/[slug]`.
- Reenvío/cancelación de invitaciones, listado de pendientes, job de expiración.
- Persistencia del consentimiento de fotos; "¿Olvidaste tu contraseña?".
- Dominio propio en Resend, React Email, otros emails transaccionales.
- Responsive móvil y dark mode.

Cada uno de esos items, si se aborda, va en su propio spec.
