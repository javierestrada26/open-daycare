**State:** Aprobado
**Depends on:** SPEC 07
**Date:** 2026-08-17

## Objetivo

Crear la tabla `public.users` (perfil de aplicación vinculado a Supabase Auth) con sus enums `user_role` y `user_status`, FK a `daycares` y a `auth.users`, RLS habilitado sin policies, un trigger `AFTER INSERT ON auth.users` que auto-crea el perfil desde `raw_user_meta_data`, un trigger `updated_at` automático, y un seed staff (`javier@google.com`) dentro de la migración — sin tocar la app Next.js.

## Alcance

**Incluye**

- Nueva migración `supabase/migrations/<timestamp>_create_users_table.sql` que:
  - Crea los enums `public.user_role` (`staff`, `parent`, `admin`) y `public.user_status` (`pending`, `active`).
  - Crea `public.users` con `id uuid PK` (FK → `auth.users(id) ON DELETE CASCADE`, mismo UUID que Auth), `daycare_id uuid NOT NULL` FK → `public.daycares(id) ON DELETE RESTRICT`, `role user_role NOT NULL`, `status user_status NOT NULL DEFAULT 'active'`, `full_name text NOT NULL`, `avatar_url text` (nullable), `notify_on_post boolean NOT NULL DEFAULT true`, `daily_summary_enabled boolean NOT NULL DEFAULT true`, `created_at`/`updated_at timestamptz NOT NULL DEFAULT now()`.
  - Índice `users_daycare_id_idx` sobre `daycare_id` (filtro frecuente: usuarios de una guardería).
  - RLS: `enable row level security` + `force row level security`. Sin policies (coherente con SPEC 07).
  - Función `public.set_updated_at()` + trigger `BEFORE UPDATE` que setea `updated_at = now()` en cada update (patrón moddatetime).
  - Función `public.handle_new_auth_user()` `SECURITY DEFINER` con `set search_path = public` que lee `daycare_id`, `role`, `full_name` de `new.raw_user_meta_data` y hace `INSERT INTO public.users`. Si falta alguno de los tres, skip (no inserta, no falla). Trigger `AFTER INSERT ON auth.users` que la invoca.
  - Revoke execute de ambas funciones a `public`, `anon`, `authenticated` (solo el trigger las invoca vía definer).
  - Seed del staff user: `INSERT INTO auth.users` con UUID fijo `b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e`, email `javier@google.com`, `encrypted_password = crypt('Abc123456', gen_salt('bf', 10))`, `email_confirmed_at = now()` (para que Supabase NO envíe confirmación al buzón real), y `raw_user_meta_data = {"daycare_id":"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d","role":"staff","full_name":"Javier"}`. El trigger `on_auth_user_created` inserta automáticamente la fila en `public.users`. `ON CONFLICT (id) DO NOTHING`.
- Aplicar con `npx supabase db push`.
- Verificar con `supabase list_tables` (verbose), `supabase execute_sql` (lectura) y `supabase get_advisors` (security + performance).

**No incluye**

- Instalar `@supabase/supabase-js`/`@supabase/ssr` o crear un cliente Supabase en la app Next.js.
- Modificar archivos de `app/` (UI, componentes, layout) o reemplazar mocks por queries reales.
- Cablear auth real en `/login`/`/activate-account` (SPEC 03 sigue con botones no funcionales) — el login con la cuenta staff seed se podrá probar una vez que exista un spec de auth que cree el cliente y maneje sesiones.
- RLS policies (van en el spec de auth cuando haya `auth.uid()` que autorizar).
- Crear `rooms`, `children`, `parent_children`, `invitations` u otras tablas — cada una va en su propio spec.
- Seed de usuarios `parent` o de otras tablas además del único staff.
- Tests SQL con `pg_tap`/`pgtest` (van cuando haya policies que probar).
- Flujos de "¿Olvidaste tu contraseña?", confirmación por email o refresh tokens.

## Modelo de datos

Nuevos enums y tabla (fiel a `07-DB-Schema/opendaycare-database-schema.md` §2 y §"ENUMs usados"):

```sql
-- Enums
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

-- Tabla
create table public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  daycare_id            uuid not null references public.daycares(id) on delete restrict,
  role                  public.user_role   not null,
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;
alter table public.users force  row level security;

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Perfil auto-creado desde auth.users
create or replace function public.handle_new_auth_user()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  v_daycare_id uuid;
  v_role       text;
  v_full_name  text;
begin
  v_daycare_id := new.raw_user_meta_data->>'daycare_id';
  v_role       := new.raw_user_meta_data->>'role';
  v_full_name  := new.raw_user_meta_data->>'full_name';
  if v_daycare_id is null or v_role is null or v_full_name is null then
    return new;  -- sin metadata: no crea perfil (lo maneja la app / invitations)
  end if;
  insert into public.users (id, daycare_id, role, full_name)
  values (new.id, v_daycare_id::uuid, v_role::public.user_role, v_full_name);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

revoke execute on function public.set_updated_at()       from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user()  from public, anon, authenticated;

-- Seed staff (el trigger on_auth_user_created inserta el perfil en public.users)
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e',
  'authenticated', 'authenticated',
  'javier@google.com',
  crypt('Abc123456', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"daycare_id":"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d","role":"staff","full_name":"Javier"}'::jsonb,
  now(), now()
)
on conflict (id) do nothing;
```

Convención (del doc de referencia): PK `id uuid` (sin `default gen_random_uuid()` — el UUID lo provee `auth.users`), `created_at`/`updated_at timestamptz`. `users.id` es el mismo UUID que `auth.users.id`. No se duplican `email` ni `password_hash` en `public.users` (viven en `auth.users`).

## Plan de implementación

1. **Crear la migración:** `npx supabase migration new create_users_table` → genera `supabase/migrations/<timestamp>_create_users_table.sql`. Escribir dentro el SQL completo del modelo de datos (CREATE TYPE × 2, CREATE TABLE, INDEX, RLS enable/force, funciones `set_updated_at` + `handle_new_auth_user`, sus triggers, `revoke execute`, seed staff con `ON CONFLICT DO NOTHING`). Verificar: SQL válido con `npx supabase db lint` si está disponible.
2. **Aplicar al remoto:** `npx supabase db push`. Confirmar el prompt de aplicación. Verificar: `npx supabase migration list` muestra `create_users_table` como aplicada (junto a `create_daycares_table`).
3. **Verificar esquema (MCP, read-only):** `supabase list_tables` (schema `public`, verbose) → `users` aparece con sus 9 columnas y tipos (`id uuid`, `daycare_id uuid`, `role user_role`, `status user_status`, `full_name text`, `avatar_url text`, `notify_on_post boolean`, `daily_summary_enabled boolean`, `created_at`/`updated_at timestamptz`), PK en `id`, FK a `auth.users(id)` y `public.daycares(id)`. `supabase execute_sql` → `select t.typname, e.enumlabel from pg_type t join pg_enum e on e.enumtypid=t.oid where t.typname in ('user_role','user_status') order by t.typname, e.enumsortorder;` devuelve `user_role` → `staff`,`parent`,`admin` y `user_status` → `pending`,`active`.
4. **Verificar triggers y RLS (MCP, read-only):** `supabase execute_sql` → `select tgname, tgrelid::regclass, tgtype from pg_trigger where tgname in ('users_set_updated_at','on_auth_user_created');` muestra ambos (uno sobre `public.users`, otro sobre `auth.users`). `select relrowsecurity, relforcerowsecurity from pg_class where relname='users';` → ambos `true`. `select * from pg_policies where tablename='users';` → 0 filas.
5. **Verificar seed staff (MCP, read-only):** `supabase execute_sql` → `select u.id, u.email, u.email_confirmed_at is not null as confirmed, p.daycare_id, p.role, p.status, p.full_name from auth.users u left join public.users p on p.id=u.id where u.email='javier@google.com';` devuelve 1 fila con `confirmed=true`, `role=staff`, `status=active`, `full_name='Javier'`, `daycare_id='a1b2c3d4-...'`, y `u.id = p.id = 'b0c1d2e3-...'` (demostrando que el trigger `on_auth_user_created` insertó el perfil automáticamente). `select count(*) from public.users;` → `1`.
6. **Verificar advisors (MCP):** `supabase get_advisors` tipo `security` → sin warnings sobre `users` (RLS habilitado, sin policies es esperado y no genera warning de "RLS disabled"). `supabase get_advisors` tipo `performance` → sin warnings críticos (el índice `users_daycare_id_idx` cubre el filtro más frecuente).

## Criterios de aceptación

- [ ] Existe `supabase/migrations/<timestamp>_create_users_table.sql` con el SQL completo (CREATE TYPE × 2, CREATE TABLE, INDEX, RLS, 2 funciones, 2 triggers, REVOKE, seed staff).
- [ ] `npx supabase migration list` muestra `create_users_table` como aplicada al remoto.
- [ ] `supabase list_tables` muestra `public.users` con las 9 columnas y tipos listados arriba, PK en `id`, FK a `auth.users(id) ON DELETE CASCADE` y a `public.daycares(id) ON DELETE RESTRICT`.
- [ ] `daycare_id`, `role`, `status`, `full_name`, `notify_on_post`, `daily_summary_enabled`, `created_at`, `updated_at` son `NOT NULL` (verificable en `information_schema.columns`).
- [ ] `avatar_url` es la única columna nullable de `users`.
- [ ] `status` tiene `DEFAULT 'active'::user_status`; `notify_on_post` y `daily_summary_enabled` tienen `DEFAULT true`.
- [ ] Los enums `user_role` y `user_status` existen con sus valores exactos: `staff/parent/admin` y `pending/active` (`pg_enum`).
- [ ] Existe el índice `users_daycare_id_idx` sobre `public.users(daycare_id)` (`pg_indexes`).
- [ ] RLS habilitado y forzado en `users` (`pg_class.relrowsecurity` y `relforcerowsecurity` = `true`).
- [ ] No existen policies en `users` (`pg_policies` → 0 filas).
- [ ] Existe el trigger `users_set_updated_at` sobre `public.users` (`BEFORE UPDATE`) invocando `public.set_updated_at()`.
- [ ] Existe el trigger `on_auth_user_created` sobre `auth.users` (`AFTER INSERT`) invocando `public.handle_new_auth_user()`.
- [ ] Las funciones `set_updated_at()` y `handle_new_auth_user()` tienen `revoke execute from public, anon, authenticated` (verificable con `has_function_privilege('anon','public.set_updated_at()','execute')` → `false`).
- [ ] `handle_new_auth_user()` es `SECURITY DEFINER` y tiene `set search_path = public` (`pg_proc.prosecdef = true`, `proconfig` incluye `search_path=public`).
- [ ] `select id, email from auth.users where email='javier@google.com'` devuelve 1 fila con `id = 'b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e'` y `email_confirmed_at IS NOT NULL`.
- [ ] `select id, daycare_id, role, status, full_name from public.users where email='javier@google.com'` (vía join) → 1 fila con `role=staff`, `status=active`, `full_name='Javier'`, `daycare_id='a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'`, `id='b0c1d2e3-...'` (mismo UUID que auth.users — confirma que el trigger creó el perfil).
- [ ] `select count(*) from public.users` = `1` (solo el staff seed).
- [ ] `supabase get_advisors` (security) no reporta `users` como tabla sin RLS.
- [ ] `supabase get_advisors` (performance) no reporta warnings críticos sobre `users`.
- [ ] Ningún archivo dentro de `app/` fue modificado.

## Decisiones tomadas y descartadas

- **Yes:** incluir el trigger `AFTER INSERT ON auth.users` + función `SECURITY DEFINER` en este spec. Es el patrón documentado en db-schema §2; permite que el seed staff y futuros signups generen su fila de perfil automáticamente, sin que la app tenga que insertar a mano.
- **No:** diferir el trigger a un spec de auth. Dejaría el seed staff sin forma automática de crear su perfil y rompería la paridad local/remoto del trigger.
- **Yes:** seed del staff dentro de la misma migración SQL con `INSERT INTO auth.users` (UUID fijo, bcrypt vía `crypt('Abc123456', gen_salt('bf',10))`, `email_confirmed_at=now()`, `raw_user_meta_data` con `daycare_id`/`role`/`full_name`). Reproducible, vive en el repo, paridad local/remoto, y ejercita el trigger `on_auth_user_created` (verificable en aceptación).
- **No:** crear el staff vía Dashboard/CLI post-migración. Más limpio pero el seed NO quedaría en el repo — no reproducible desde migrations.
- **No:** duplicar `email` ni `password_hash` en `public.users`. db-schema es explícito: Auth ya los gestiona en `auth.users`; duplicar rompe single-source-of-truth y abre inconsistencias.
- **Yes:** RLS habilitado + `force row level security`, sin policies. Coherente con SPEC 07; SPEC 03 aún tiene botones no funcionales y no hay `auth.uid()` cableado. `service_role` y superuser bypassan RLS; `anon`/`authenticated` quedan bloqueados hasta el spec de auth.
- **No:** policies básicas ahora (ej. `USING (auth.uid() = id)`). Adelantarían trabajo del spec de auth sin tener a quién autorizar; riesgo de quedar mal y tener que re-hacer.
- **Yes:** trigger `BEFORE UPDATE` que setea `updated_at = now()` (patrón moddatetime). `users` sí lista `updated_at` (a diferencia de `daycares`); la app Next.js no está lista para gestionarlo manualmente.
- **No:** gestionar `updated_at` desde la app. Propenso a olvidos y a filas con `updated_at` desactualizado.
- **Yes:** `daycare_id NOT NULL`. staff/parent siempre pertenecen a un daycare; el `admin` se asigna a la guardería única por ahora. Coincide con db-schema (no marca `daycare_id` como nullable) y con el escenario staff/parent pedido.
- **No:** `daycare_id` nullable. Relaja una FK que el resto del modelo asume no-nula; para el escenario actual no se necesita.
- **Yes:** FK `users.id → auth.users(id) ON DELETE CASCADE`. Si se borra el auth user, su perfil se borra sola — sin perfiles huérfanos. db-schema lo especifica.
- **No:** `ON DELETE SET NULL` o `RESTRICT` en `users.id → auth.users`. Rompería la FK natural Auth↔perfil o dejaría huérfanos.
- **Yes:** FK `users.daycare_id → daycares(id) ON DELETE RESTRICT`. Evita borrar una guardería con usuarios colgando; más seguro que `CASCADE` (que borraría todos los usuarios de la guardería).
- **No:** `ON DELETE CASCADE` en `users.daycare_id → daycares`. Borrar una guardería borraría en cascada todos sus usuarios — operación destructiva que conviene forzar explícitamente.
- **Yes:** índice `users_daycare_id_idx` sobre `daycare_id`. Filtro más frecuente ("usuarios de esta guardería", feed, listings); el skill best-practices recomienda indexar FKs que se filtran o se joinean.
- **No:** índice sobre `role` o `status`. Cardinalidad baja (`role` 3 valores, `status` 2) — índice poco selectivo; no se justifica hasta que haya queries diferenciales.
- **Yes:** `handle_new_auth_user()` con `skip` silencioso si falta `daycare_id`/`role`/`full_name` en `raw_user_meta_data` (retorna `new` sin insertar). Permite signups sin metadata (Auth admin-created users, flujos futuros) sin romper; el perfil se crea después vía `invitations` u otro flujo.
- **No:** `raise exception` si falta metadata. Rompería signups legítimos sin metadata; el trigger debe ser no-bloqueante.
- **Yes:** `revoke execute` de ambas funciones a `public`/`anon`/`authenticated`. Solo el trigger las invoca vía definer; least-privilege.
- **No:** dejar `execute` público. `handle_new_auth_user()` es `SECURITY DEFINER` — ejecutarla fuera del trigger sería un vector de escalación.
- **Yes:** UUID fijo `b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e` para el seed staff (paridad local/remoto, ID estable para futuras FK en otros specs).
- **No:** `gen_random_uuid()` para el seed. Haría el ID no determinista entre entornos.
- **Yes:** `ON CONFLICT (id) DO NOTHING` en el seed. Las migraciones se aplican una vez, pero el `ON CONFLICT` protege si el historial se reconcilia y se re-aplica.
- **Yes:** `email_confirmed_at = now()` en el seed. Permite login inmediato sin confirmación por email durante pruebas, y —crítico aquí— evita que Supabase envíe un email de confirmación al buzón real `javier@google.com`.
- **No:** dejar `email_confirmed_at NULL`. Bloquearía el login hasta confirmación Y dispararía un email al buzón real ajeno.
- **Yes:** usar el dominio real `javier@google.com` tal como pidió el usuario, con `full_name='Javier'`. El usuario lo eligió para poder probar login; `email_confirmed_at=now()` garantiza que Supabase no envíe nada a ese buzón.
- **No:** cambiar a `javier@opendaycare.test`. Era la alternativa más segura (buzón no-real), pero el usuario eligió explícitamente el dominio real.
- **Yes:** PK `uuid` (sin `default gen_random_uuid()`) en `users.id`. El UUID lo provee `auth.users` (misma fila); no se generan `users` sin pasar por Auth. Consistente con db-schema §2.
- **No:** `bigint identity` para `users.id`. Rompería la FK 1:1 con `auth.users(id)` (que es `uuid`); la convención del proyecto es UUID.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `handle_new_auth_user()` `SECURITY DEFINER` con `search_path` implícito podría sufrir search_path injection | `set search_path = public` en la definición de la función (best practice Supabase) |
| Insertar directo en `auth.users` acopla la migración a internals de GoTrue (columnas pueden cambiar entre versiones) | Se insertan solo columnas estables del contrato público de Auth (`id`, `aud`, `role`, `email`, `encrypted_password`, `email_confirmed_at`, `raw_app_meta_data`, `raw_user_meta_data`, `created_at`, `updated_at`); si una futura versión de GoTrue las renombra, la migración falla temprano en `db push` y se detecta |
| `crypt()` requiere la extensión `pgcrypto` | `pgcrypto` viene preinstalada en Supabase (es parte del stack); si no, `create extension if not exists pgcrypto` al inicio de la migración |
| El trigger `on_auth_user_created` puede interferir con flujos futuros de Auth (OAuth, magic link, SSO) que no seteen `raw_user_meta_data` con `daycare_id`/`role`/`full_name` | El trigger hace `skip` silencioso si falta cualquiera de los tres — no bloquea esos flujos; el perfil se crea después vía `invitations` u otro spec |
| `force row level security` podría bloquear accesos que se asumían disponibles | `service_role` y superuser bypassan RLS; `anon`/`authenticated` quedan bloqueados, que es lo deseado sin auth cableado |
| El seed staff usa un buzón real ajeno (`javier@google.com`) | `email_confirmed_at = now()` en el INSERT del seed evita que Supabase envíe email de confirmación a ese buzón. La cuenta solo existe para pruebas de login locales/demo; rotar/eliminar cuando el proyecto pase a producción |
| El seed staff con contraseña `Abc123456` es simple | Es una cuenta seed de prueba en entorno de desarrollo/demo. Se rota/elimina cuando el proyecto pase a producción |
| `db push` puede detectar drift si el historial remoto no está alineado con el local | SPEC 07 ya reparó el historial de test; antes de `db push` verificar `npx supabase migration list` y reparar si hace falta |
| `auth.users` no tiene `ON CONFLICT (id)` por defecto — el seed podría chocar si se re-corre | `ON CONFLICT (id) DO NOTHING` explícito en el INSERT |

## Qué **no** está en este spec

- Instalar `@supabase/supabase-js`/`@supabase/ssr` o crear un cliente Supabase en la app Next.js.
- Cablear auth real en `/login`/`/activate-account` (SPEC 03 sigue con botones no funcionales) — el login con la cuenta staff seed se podrá probar una vez que exista un spec de auth que cree el cliente y maneje sesiones.
- Modificar archivos de `app/` (UI, componentes, layout) o reemplazar mocks por queries reales.
- RLS policies (van en el spec de auth cuando haya `auth.uid()` que autorizar).
- Crear `rooms`, `children`, `parent_children`, `invitations` u otras tablas — cada una va en su propio spec.
- Seed de usuarios `parent` o de otras tablas además del único staff.
- Tests SQL con `pg_tap`/`pgtest` (van cuando haya policies que probar).
- Flujos de "¿Olvidaste tu contraseña?", confirmación por email o refresh tokens.

Cada uno de esos items, si se aborda, va en su propio spec.
