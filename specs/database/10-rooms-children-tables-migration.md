**State:** Aprobado
**Depends on:** SPEC 07, SPEC 08
**Date:** 2026-08-24

## Objetivo

Crear las tablas `rooms` y `children` (con enum `child_status`) en Supabase vía migración versionada, con índices, trigger `updated_at`, policies RLS mínimas por daycare y seed de 3 salas (Soles, Lunas, Estrellas) — sin sembrar ningún niño y sin tocar la app Next.js.

## Alcance

**Incluye**

- Cargar la skill `supabase-postgres-best-practices` antes de escribir el SQL (regla AGENTS.md).
- Crear la migración `supabase/migrations/<timestamp>_create_rooms_children_tables.sql` (vía `npx supabase migration new create_rooms_children_tables`) que:
  - Crea el enum `public.child_status` con valores `('active', 'archived')`.
  - Crea `public.rooms` fiel al doc de referencia §3: `id uuid PK default gen_random_uuid()`, `daycare_id uuid not null references public.daycares(id) on delete restrict`, `name text not null`, `created_at timestamptz not null default now()`. Índice `rooms_daycare_id_idx on public.rooms(daycare_id)`. RLS `enable` + `force`.
  - Crea `public.children` fiel al doc §4: `id uuid PK default gen_random_uuid()`, `room_id uuid not null references public.rooms(id) on delete restrict`, `full_name text not null`, `birth_date date not null`, `enrolled_at date not null default current_date`, `medical_notes text` (nullable), `allergy_tags text[] not null default '{}'`, `photo_consent boolean not null default true`, `status public.child_status not null default 'active'`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`. Índice `children_room_id_idx on public.children(room_id)`. Trigger `children_set_updated_at before update` reutilizando la función `public.set_updated_at()` (existe desde SPEC 08). RLS `enable` + `force`.
  - Crea la función `public.current_daycare_id()` (`security definer`, `language sql`) que devuelve el `daycare_id` del usuario autenticado leyendo `public.users` (bypassando el RLS de `public.users`, que tiene `FORCE RLS` sin policies todavía — SPEC 09 las difirió). `revoke execute from public, anon`; `grant execute to authenticated`.
  - Crea 3 policies `to authenticated`:
    - `rooms_select_same_daycare` (`for select`, `using (daycare_id = public.current_daycare_id())`).
    - `children_select_same_daycare` (`for select`, `using (exists (select 1 from public.rooms r where r.id = children.room_id and r.daycare_id = public.current_daycare_id()))`).
    - `children_insert_same_daycare` (`for insert`, `with check` con el mismo `exists`).
  - Sin policies `update`/`delete` (no hay edición ni archivado todavía). Sin distinción de rol staff/parent (se refina en el spec de `parent_children`).
  - Seed de 3 salas con UUIDs fijos y FK al daycare seed `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d` (SPEC 07), `created_at` escalonado (`now()`, `now() + interval '1 minute'`, `now() + interval '2 minutes'`) para garantizar orden estable Soles → Lunas → Estrellas sin agregar columnas fuera del doc de referencia, con `on conflict (id) do nothing`.
- Aplicar al remoto con `npx supabase db push`.
- Verificar con MCP: `list_tables` (schema `public`, verbose) muestra `rooms` y `children` con sus columnas; `execute_sql` read-only devuelve las 3 salas seed y 0 niños; `get_advisors` (security + performance) sin warnings nuevos sobre estas tablas.

**No incluye**

- Seed de niños (la tabla `children` queda vacía).
- Tabla `parent_children`, `invitations` ni ninguna otra tabla del doc de referencia.
- Policies `update`/`delete` sobre `rooms` o `children`.
- Policies por rol (staff vs parent) — se diferencian en el spec de `parent_children`.
- Modificar el schema o las policies de `public.users` o `public.daycares` (incluido añadir la policy de auto-lectura sobre `public.users`; se evita tocando esa tabla con la función `current_daycare_id()`).
- Tests `pg_tap`/`pgtest` (van cuando haya policies que probar).
- Cualquier cambio en `app/` (UI, componentes, actions, lib).

## Modelo de datos

```sql
-- Enum
create type public.child_status as enum ('active', 'archived');

-- rooms
create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  name       text not null,
  created_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);

alter table public.rooms enable row level security;
alter table public.rooms force  row level security;

-- children
create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms(id) on delete restrict,
  full_name      text not null,
  birth_date     date not null,
  enrolled_at    date not null default current_date,
  medical_notes  text,
  allergy_tags   text[] not null default '{}',
  photo_consent  boolean not null default true,
  status         public.child_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index children_room_id_idx on public.children (room_id);

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

alter table public.children enable row level security;
alter table public.children force  row level security;

-- Helper: daycare_id del usuario autenticado (bypassa el RLS de public.users
-- que hoy no tiene policies — SPEC 09 las difirió). Patrón security definer
-- igual que handle_new_auth_user() en SPEC 08.
create or replace function public.current_daycare_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select u.daycare_id from public.users u where u.id = (select auth.uid());
$$;

revoke execute on function public.current_daycare_id() from public, anon;
grant   execute on function public.current_daycare_id() to authenticated;

-- Policies por daycare
create policy rooms_select_same_daycare on public.rooms
  for select to authenticated
  using (daycare_id = public.current_daycare_id());

create policy children_select_same_daycare on public.children
  for select to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

create policy children_insert_same_daycare on public.children
  for insert to authenticated
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

-- Seed de 3 salas (UUIDs fijos, created_at escalonado para orden estable)
insert into public.rooms (id, daycare_id, name, created_at) values
  ('d1e2f3a4-0001-4d7e-8f9a-0b1c2d3e4f5a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Soles',     now()),
  ('d1e2f3a4-0002-4d7e-8f9a-0b1c2d3e4f5a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Lunas',     now() + interval '1 minute'),
  ('d1e2f3a4-0003-4d7e-8f9a-0b1c2d3e4f5a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Estrellas', now() + interval '2 minutes')
on conflict (id) do nothing;
```

Convención (del doc de referencia): PK `id` `uuid` default `gen_random_uuid()`, `created_at`/`updated_at` `timestamptz`. FKs `on delete restrict` (no propagar borrado de salas/daycares con niños colgando). `allergy_tags` en inglés; la UI traduce. `medical_notes` nullable (opcional en el formulario). `enrolled_at`/`photo_consent`/`status` con defaults del schema.

## Plan de implementación

1. **Cargar la skill** `supabase-postgres-best-practices` y revisar sus reglas antes de escribir el SQL (regla AGENTS.md). Documentar cualquier desviación en "Decisiones".
2. **Crear la migración:** `npx supabase migration new create_rooms_children_tables` → genera `supabase/migrations/<timestamp>_create_rooms_children_tables.sql`. Escribir dentro el SQL del modelo de datos (enum + tablas + índices + trigger + función + policies + seed). Verificar: `npx supabase db lint` (si disponible) sin errores de sintaxis.
3. **Aplicar al remoto:** `npx supabase db push`. Confirmar el prompt. Verificar: `npx supabase migration list` muestra `create_rooms_children_tables` como aplicada.
4. **Verificar remoto (MCP, read-only):**
   - `supabase list_tables` (schema `public`, verbose) → `rooms` (4 columnas) y `children` (11 columnas) aparecen con tipos correctos.
   - `supabase execute_sql` → `select id, name, created_at from public.rooms order by created_at;` devuelve 3 filas (Soles, Lunas, Estrellas) con los UUIDs fijos y orden escalonado.
   - `supabase execute_sql` → `select count(*) from public.children;` devuelve `0`.
   - `supabase execute_sql` → `select relrowsecurity, relforcerowsecurity from pg_class where relname in ('rooms','children');` → ambos `true` en cada tabla.
   - `supabase execute_sql` → `select * from pg_policies where tablename in ('rooms','children');` → 3 policies.
   - `supabase get_advisors` (security) → sin warnings sobre `rooms`/`children` (RLS habilitado, policies presentes). `supabase get_advisors` (performance) → sin warnings (índices en FKs).
5. **Verificar lectura con sesión (opcional, manual):** con el staff seed de SPEC 08 (`javier@google.com`), un `select` client-side a `rooms` devuelve 3 filas y a `children` 0 filas (RLS permite lectura del propio daycare). Esto se valida a fondo en SPEC 11; acá basta con que `get_advisors` no reporte problemas.

## Criterios de aceptación

- [ ] Existe `supabase/migrations/<timestamp>_create_rooms_children_tables.sql` con el SQL de enum + 2 tablas + índices + trigger + función + 3 policies + seed.
- [ ] `supabase list_tables` muestra `public.rooms` con `id uuid`, `daycare_id uuid`, `name text`, `created_at timestamptz`.
- [ ] `supabase list_tables` muestra `public.children` con las 11 columnas del doc de referencia §4 y tipos correctos.
- [ ] `child_status` existe como enum con valores `active`/`archived` (`select enum_range(null::public.child_status)` → ambos).
- [ ] `rooms_daycare_id_idx` y `children_room_id_idx` existen (`select indexname from pg_indexes where tablename in ('rooms','children')`).
- [ ] El trigger `children_set_updated_at` existe sobre `children` y reutiliza `public.set_updated_at()` (sin crear una función nueva).
- [ ] RLS `enable` + `force` activos en `rooms` y `children` (`relrowsecurity` y `relforcerowsecurity` ambos `true`).
- [ ] Existen exactamente 3 policies: `rooms_select_same_daycare`, `children_select_same_daycare`, `children_insert_same_daycare` (`pg_policies`).
- [ ] No existen policies `update`/`delete` sobre `rooms` o `children`.
- [ ] `public.current_daycare_id()` existe, es `security definer`, `revoke` de `public`/`anon`, `grant` a `authenticated`.
- [ ] `select id, name from public.rooms order by created_at` devuelve exactamente 3 filas en orden Soles, Lunas, Estrellas con los UUIDs fijos del spec.
- [ ] `select count(*) from public.children` devuelve `0` (sin niños sembrados).
- [ ] `supabase get_advisors` (security) no reporta `rooms` ni `children` como tablas sin RLS ni sin policies.
- [ ] `supabase get_advisors` (performance) no reporta warnings de índices faltantes en FKs de `rooms`/`children`.
- [ ] Ningún archivo dentro de `app/` fue modificado.

## Decisiones tomadas y descartadas

- **Yes:** RLS incluido en este spec (a diferencia de SPEC 09 que difirió las policies de `public.users`). SPEC 11 necesita leer `rooms`/`children` con el cliente SSR del usuario autenticado; con `FORCE RLS` y sin policies la lectura devolvería 0 filas.
- **No:** deferir RLS a otro spec. Dejaría la pantalla `/kids` rota hasta ese spec.
- **Yes:** función `security definer` `current_daycare_id()` para obtener el `daycare_id` del usuario. `public.users` tiene `FORCE RLS` sin policies (SPEC 09 las difirió), así que un subquery directo a `public.users` desde la policy devolvería `NULL`. La función bypassa ese RLS (patrón estándar Supabase, igual que `handle_new_auth_user()` en SPEC 08). Evita tocar el schema/policies de `public.users` en este spec.
- **No:** añadir una policy de auto-lectura sobre `public.users` acá. Ampliaría el scope a otra tabla; la función resuelve el problema sin tocar `users`.
- **No:** policies por rol (staff vs parent). Hoy solo existe el seed staff; la distinción de qué puede ver un padre va en el spec de `parent_children`. Mientras tanto, cualquier autenticado del daycare lee/escribe children — aceptable para una guardería con un solo staff.
- **Yes:** PKs `uuid default gen_random_uuid()` pese a que `supabase-postgres-best-practices` recomienda `bigint identity` para single-DB. Consistencia con la convención explícita del doc de referencia del proyecto (UUID en las 13 tablas) y con SPEC 07/08; el volumen de una guardería hace el costo de fragmentación de UUIDv4 despreciable.
- **No:** `bigint identity` o UUIDv7. Rompería la convención del proyecto.
- **Yes:** `medical_notes text` nullable y `allergy_tags text[] not null default '{}'`. El formulario (SPEC 04) deja ambos opcionales; guardar `null`/`'{}'` cuando vienen vacíos es honesto.
- **No:** `allergy_tags` nullable. Un array vacío `'{}'` expresa mejor "sin alergias" que `null`.
- **Yes:** `enrolled_at date not null default current_date` y `photo_consent boolean not null default true`. El formulario no los pide; los defaults del doc de referencia cubren el alta.
- **Yes:** FKs `on delete restrict`. No se puede borrar una sala con niños colgando ni una guardería con salas; coherente con `on delete restrict` de `users.daycare_id` en SPEC 08.
- **No:** `on delete cascade`. Rompería datos al borrar una sala.
- **Yes:** seed de 3 salas con UUIDs fijos y `created_at` escalonado dentro de la misma migración. El usuario pidió 3 salas (una "Soles"); los UUIDs fijos dan paridad local/remoto y FKs estables; el escalonado de `created_at` garantiza el orden Soles → Lunas → Estrellas al ordenar por `created_at` en la app sin agregar columnas fuera del doc de referencia.
- **No:** `order_index` o `sort_order` en `rooms`. No está en el doc de referencia; el escalonado de `created_at` lo resuelve sin desviarse del schema.
- **No:** `UNIQUE(daycare_id, name)` en `rooms`. No lo pide el doc de referencia; se puede añadir después si hace falta.
- **No:** seed de niños. El usuario lo pidió explícitamente ("no ocupamos ningún niño en la tabla").
- **Yes:** reutilizar `public.set_updated_at()` (SPEC 08) para el trigger de `children`. Evita duplicar función.
- **No:** crear una función `set_updated_at` nueva. Innecesario.
- **Yes:** `revoke execute on current_daycare_id() from public, anon` + `grant to authenticated`. Least-privilege; solo usuarios logueados pueden resolver su daycare.
- **No:** `grant to public`. Abriría la función a anónimos.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `npx supabase login`/`link` requiere un PAT que puede no estar configurado | Si la CLI no se autentica, caer al MCP `apply_migration` con el mismo SQL como fallback temporal (registrándolo en decisions) y luego reconciliar con `npx supabase db push` o `migration repair` |
| La función `current_daycare_id()` bypassa el RLS de `public.users` — si `public.users` tuviera policies en el futuro, la función seguiría bypassandolas | Aceptado y documentado; cuando llegue el spec de policies de `users`, se puede reemplazar la función por un subquery directo a `public.users` en las policies de `rooms`/`children` y dropear la función |
| `now() + interval` en el seed evalúa al momento del `db push` — si se re-corre la migración, los timestamps cambian | Las migraciones corren una sola vez; `on conflict (id) do nothing` protege si se re-aplica |
| Advisors pueden flaggear `auth.uid()` en subqueries de policies | Las policies usan `current_daycare_id()` (function call, no subquery directo) — los advisors no lo marcan como subquery; los índices en `daycare_id`/`room_id` cubren el rendimiento |
| `FORCE RLS` en `children` sin policy `update` bloquearía futuras ediciones | Conforme al alcance (no hay edición en SPEC 11); el spec de edición añadirá la policy `update` |

## Qué **no** está en este spec

- Seed de niños (la tabla `children` queda vacía).
- Tabla `parent_children`, `invitations` ni ninguna otra tabla del doc de referencia.
- Policies `update`/`delete` o por rol sobre `rooms`/`children`.
- Modificar el schema o las policies de `public.users` o `public.daycares`.
- Tests `pg_tap`/`pgtest`.
- Cualquier cambio en `app/` (UI, componentes, actions, lib).

Cada uno de esos items, si se aborda, va en su propio spec.
