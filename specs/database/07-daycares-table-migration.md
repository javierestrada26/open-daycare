**State:** Implementado
**Depends on:** —
**Date:** 2026-08-17

## Objetivo

Crear la tabla `daycares` (entidad raíz del esquema) en el proyecto Supabase remoto aplicando el patrón de migraciones con la Supabase CLI (`supabase/migrations/`), con RLS habilitado y una fila seed, sin tocar la app Next.js.

## Alcance

**Incluye**

- Inicializar el workflow local de Supabase CLI: `npx supabase init` (crea `supabase/config.toml` + `supabase/migrations/`).
- Enlazar el proyecto remoto actual (`npx supabase link --project-ref <ref>`) y limpiar las 2 migraciones de prueba del historial remoto (`create_test_table` `20260817215703` y `drop_test_table` `20260817215919`) con `npx supabase migration repair --remote --status reverted`.
- Crear la primera migración real `supabase/migrations/<timestamp>_create_daycares_table.sql` que:
  - Crea `public.daycares` con `id uuid PK default gen_random_uuid()`, `name text NOT NULL`, `created_at timestamptz NOT NULL default now()`.
  - Habilita RLS: `alter table daycares enable row level security;` + `alter table daycares force row level security;`. Sin policies (bloqueado para `anon`/`authenticated`; `service_role` y SQL directo siguen funcionando).
  - Inserta una fila seed con UUID fijo determinista: "Guardería Sala Soles" (coincide con el mock de SPEC 01).
- Aplicar al remoto con `npx supabase db push`.
- Verificar con `supabase list_tables` (MCP) y `supabase get_advisors` (security) tras el DDL.

**No incluye**

- Instalar `@supabase/supabase-js` / `@supabase/ssr` o crear un cliente Supabase en la app Next.js.
- Modificar cualquier archivo de `app/` (UI, componentes, layout) o reemplazar mocks por queries reales.
- Crear `users`, `rooms`, `children` u otras tablas del esquema — cada una va en su propio spec.
- Auth, triggers sobre `auth.users`, o policies que dependan de `auth.uid()`.
- Seed de otras tablas o datos demo además de la guardería única.
- Tests SQL con `pg_tap` / `pgtest` (van cuando haya policies que probar).

## Modelo de datos

Nueva tabla `public.daycares` (fiel a `07-DB-Schema/opendaycare-database-schema.md` §1):

```sql
create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
alter table public.daycares force row level security;

-- seed determinista (UUID fijo para paridad local/remoto y FK estable)
insert into public.daycares (id, name) values
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Guardería Sala Soles');
```

Convención (del doc de referencia): PK `id` `uuid` default `gen_random_uuid()`, `created_at` `timestamptz`. Identificadores en lowercase snake_case. `daycares` es la entidad raíz; `users`, `rooms`, etc. referenciarán `daycares.id` en specs posteriores.

## Plan de implementación

1. **`npx supabase init`** en la raíz del repo: crea `supabase/config.toml` y `supabase/migrations/` (vacío). Verificar: aparece la carpeta `supabase/` con `config.toml`. Añadir `supabase/.temp/` y `supabase/.branches/` a `.gitignore` si la CLI no lo hace.
2. **Enlazar y limpiar el remoto:** obtener el project ref (vía MCP `supabase_get_project_url` o `npx supabase projects list` tras `npx supabase login`). Ejecutar `npx supabase link --project-ref <ref>`. Luego `npx supabase migration repair --remote --status reverted 20260817215703 20260817215919` para quitar las 2 migraciones de prueba del historial remoto (la tabla test ya fue dropeada, no hay schema que revertir). Verificar: `npx supabase migration list` no muestra las migraciones de prueba.
3. **Crear la migración:** `npx supabase migration new create_daycares_table` → genera `supabase/migrations/<timestamp>_create_daycares_table.sql`. Escribir dentro el SQL del modelo de datos (CREATE TABLE + RLS enable/force + seed INSERT). Verificar: SQL válido (revisar con `npx supabase db lint` si está disponible).
4. **Aplicar al remoto:** `npx supabase db push`. Confirmar el prompt de aplicación. Verificar: `npx supabase migration list` muestra `create_daycares_table` como aplicada.
5. **Verificar remoto (MCP, read-only):** `supabase list_tables` (schema `public`, verbose) → `daycares` aparece con sus 3 columnas y tipos. `supabase execute_sql` → `select id, name, created_at from daycares;` devuelve la fila seed "Guardería Sala Soles" con el UUID fijo. `supabase get_advisors` tipo `security` → sin warnings sobre `daycares` (RLS habilitado). `supabase get_advisors` tipo `performance` → sin warnings.

## Criterios de aceptación

- [x] Existe `supabase/config.toml` y `supabase/migrations/` en el repo (generados por `supabase init`).
- [x] `npx supabase migration list` no lista las migraciones de prueba `create_test_table`/`drop_test_table` (fueron reparadas).
- [x] Existe `supabase/migrations/<timestamp>_create_daycares_table.sql` con el SQL de creación + RLS + seed.
- [x] `supabase list_tables` muestra `public.daycares` con columnas `id uuid`, `name text`, `created_at timestamptz`.
- [x] `name` es `NOT NULL` (verificable en `information_schema.columns`).
- [x] RLS está habilitado en `daycares` (`select relrowsecurity, relforcerowsecurity from pg_class where relname='daycares'` → ambos `true`).
- [x] No existen policies en `daycares` (`select * from pg_policies where tablename='daycares'` → 0 filas).
- [x] `select id, name from daycares` devuelve exactamente 1 fila: name "Guardería Sala Soles" e id `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`.
- [x] `supabase get_advisors` (security) no reporta `daycares` como tabla sin RLS.
- [x] Ningún archivo dentro de `app/` fue modificado.

## Decisiones tomadas y descartadas

- **Yes:** patrón de migraciones con Supabase CLI (`supabase/migrations/*.sql` versionados + `db push`). Repetible, versionado y fuente de verdad en el repo; el usuario lo eligió como "patrón de migraciones".
- **No:** aplicar solo con MCP `apply_migration` sin archivos locales. No deja fuente de verdad versionada en el repo.
- **Yes:** DB-only (tabla + RLS + seed). Mantiene el spec enfocado; el cliente Supabase en Next.js y el reemplazo de mocks van en specs propios.
- **No:** instalar `@supabase/supabase-js`/`@supabase/ssr` ahora. Cambia el stack de la app y abre otro dominio (auth, SSR).
- **Yes:** columnas fieles al doc de referencia (`id`, `name`, `created_at`) con `name NOT NULL`. Consistencia con la convención del proyecto (13 tablas usan el mismo patrón).
- **No:** `updated_at` + trigger en `daycares`. El doc de referencia no lo lista para esta tabla; `daycares` es una entidad raíz estática que rara vez cambia.
- **No:** `UNIQUE` en `name`. No hay requisito; dos guarderías podrían compartir nombre; se puede añadir después si hace falta.
- **Yes:** PK `uuid default gen_random_uuid()` pese a que `supabase-postgres-best-practices` recomienda `bigint identity` para single-DB. Se sigue la convención explícita del doc de referencia del proyecto (UUID en todas las tablas, IDs expuestos en URLs); el volumen de una guardería hace el costo de fragmentación de UUIDv4 despreciable.
- **No:** `bigint identity` o UUIDv7. Rompería la convención del proyecto y requeriría extensión `pg_uuidv7`.
- **Yes:** RLS habilitado + `force row level security`, sin policies. Postura segura: `anon`/`authenticated` no acceden hasta que llegue el spec de auth; `service_role` y SQL directo siguen funcionando.
- **No:** policy permisiva `USING (true)` para lectura/escritura ahora. Sin auth no hay a quién autorizar; abrir la tabla al anon contradice least-privilege.
- **No:** policy basada en `auth.uid()`. No hay tabla `users` ni auth cableado todavía.
- **Yes:** seed "Guardería Sala Soles" dentro de la misma migración con UUID fijo `a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d`. El usuario lo pidió; el UUID fijo da paridad local/remoto y un FK estable para specs futuros.
- **No:** seed en `supabase/seed.sql` aparte. El usuario eligió dentro de la migración.
- **No:** seed con `gen_random_uuid()`. Haría el ID no determinista entre entornos.
- **Yes:** limpiar las 2 migraciones de prueba del remoto con `migration repair --status reverted`. El usuario lo pidió; netean a nada (la tabla test ya fue dropeada) y dejan un historial limpio.
- **No:** dejar las migraciones de prueba en el historial. Contaminan `migration list` y pueden confundir el drift detection de `db push`.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `npx supabase login`/`link` requiere un Personal Access Token (PAT) que puede no estar configurado | Documentar el paso; si la CLI no se autentica, caer al MCP `apply_migration` con el mismo SQL como fallback temporal (registrándolo en decisions) |
| `db push` puede detectar drift entre el local vacío y el remoto con historial de test | Ejecutar `migration repair --status reverted` antes del `db push` para alinear historiales |
| `force row level security` puede bloquear accesos que se asumían disponibles | `service_role` y superuser bypassan RLS; solo `anon`/`authenticated` quedan bloqueados, que es lo deseado sin auth |
| Insertar seed con UUID fijo puede chocar si la migración se re-corre | Las migraciones se aplican una sola vez; no se re-corren. Si hiciera falta, usar `on conflict (id) do nothing` |
| El doc de referencia usa `gen_random_uuid()` (UUIDv4) que la skill best-practices desaconseja para PKs grandes | `daycares` tendrá muy pocas filas; el costo de fragmentación es despreciable. Consistencia con la convención del proyecto pesa más |
| `supabase/.temp/` y `.branches/` pueden quedar sin ignorar | Añadirlos a `.gitignore` en el paso 1 |

## Qué **no** está en este spec

- Instalar `@supabase/supabase-js`/`@supabase/ssr` o crear un cliente Supabase en Next.js.
- Modificar cualquier archivo de `app/` (UI, componentes, layout) o reemplazar mocks por queries reales.
- Crear `users`, `rooms`, `children` u otras tablas del esquema — cada una va en su propio spec.
- Auth, triggers sobre `auth.users`, o policies que dependan de `auth.uid()`.
- Seed de otras tablas o datos demo además de la guardería única.
- Tests SQL con `pg_tap`/`pgtest` (van cuando haya policies que probar).

Cada uno de esos items, si se aborda, va en su propio spec.
