**State:** Borrador
**Depends on:** SPEC 02, SPEC 04, SPEC 09, SPEC 10
**Date:** 2026-08-24

## Objetivo

Reemplazar los mocks de `/kids` y `/kids/[slug]` por datos reales de Supabase (lista agrupada por las 3 salas, buscador funcional, perfil real con 404) y hacer que "Guardar" del modal Agregar niño inserte en `children` — sin edición ni archivado.

## Alcance

**Incluye**

- Crear `app/_lib/kids.ts` (módulo TS puro, sin `'use client'`, usable en server y client) con helpers compartidos:
  - `slugify(fullName: string): string` — kebab-case desde el nombre.
  - `formatAgeYears(iso: string): string` — "3 años" / "1 año" (singular <2).
  - `formatBirthShort(iso: string): string` — "12 mar 2022" (mes abreviado es-ES, sin punto).
  - `formatEnrollShort(iso: string): string` — "ago 2026" (mes abreviado + año).
  - `avatarForIndex(i: number): { bg: string; color: string }` — ciclo de la paleta existente (sky, pink, green, yellow, purple con sus tokens CSS `--color-avatar-*-bg`/`--color-avatar-*`).
  - `parseAllergyTags(text: string): string[]` — split por coma, trim, lowercase, mapeo ES→EN (maní/mani→peanut, lactosa→lactose, glúten/gluten→gluten, huevo→egg); valores no mapeados se guardan en minúscula tal cual.
  - `allergyBadge(tags: string[]): "MANÍ" | "LACTOSA" | "VINCULAR"` — primer tag conocido (peanut→MANÍ, lactose→LACTOSA); si no hay, `VINCULAR`.
  - Tipos `RoomVm`, `ChildVm`, `KidCardVm` (serializables).
- Crear `app/_actions/kids.ts` (`'use server'`) con `createKid(input: { fullName: string; birthDate: string; roomId: string; allergiesText: string; medicalNotes: string }): Promise<{ error?: string }>`:
  - Server client con `createClient(await cookies())`.
  - Validación mínima: `fullName` trim no vacío; `birthDate` regex `^\d{2}/\d{2}/\d{4}$` + fecha real válida (parseo `dd/mm/aaaa`) + no futura; `roomId` uuid válido. Si falla, retorna `{ error: "Revisá el nombre y la fecha (dd/mm/aaaa)." }`.
  - Mapeo `allergyTags = parseAllergyTags(allergiesText)`; `medicalNotes` `null` si vacío.
  - Insert en `public.children` con `room_id`, `full_name`, `birth_date`, `medical_notes`, `allergy_tags` (los defaults del schema cubren `enrolled_at`, `photo_consent`, `status`).
  - `revalidatePath('/kids', 'layout')` tras insertar.
- Modificar `app/kids/page.tsx` (sigue Server Component, async): `createClient(await cookies())`; fetch `rooms` (`select id, name, created_at` ordenado por `created_at` asc) y `children` (`select id, full_name, birth_date, allergy_tags, medical_notes, room_id` donde `status = 'active'` — la policy RLS ya filtra por daycare). Construye `KidCardVm[]` (slug, avatar por índice global, name, age pre-formateado, `linked` fijo "sin padres vinculados", badge). Renderiza header ("GESTIÓN / Niños" + `<AddKidModal rooms={rooms} />`) y `<KidsBrowser rooms={rooms} kids={kidsVm} />`. El mock `KIDS` se elimina.
- Crear `app/_components/KidsBrowser.tsx` (`'use client'`): props `{ rooms: RoomVm[]; kids: KidCardVm[] }`. Estado `query` (string). Filtra `kids` por `name` case-insensitive. Renderiza el buscador (mismo look que SPEC 02: input con lupa, `--color-surface` + `--color-border-cream`), 3 secciones siempre visibles ("SALA {NAME} · N niños" con `tracking-[0.8px]` y línea `--color-rule`), grilla `grid-cols-2 gap-[14px]` de `<KidCard/>` por sala; sala vacía → texto "Aún no hay niños en esta sala" en `--color-ink-muted`.
- Modificar `app/_components/AddKidModal.tsx`: prop `rooms: { id: string; name: string }[]`. El `<select>` de SALA pasa a dinámico (opciones desde `rooms`, default la primera = Soles). "Guardar" llama `createKid` con el form; estado `saving` (botón "Guardando…", `disabled`); error inline en `--color-primary-dark` bajo el cuerpo (mismo patrón que login SPEC 09); éxito → `close()` + reset (la lista se refresca sola por `revalidatePath`). El tipo `Sala` hardcodeado se elimina. El resto del layout (header Cancelar/Agregar niño/Guardar, campos, backdrop, ESC) intacto.
- Modificar `app/kids/[slug]/page.tsx` (async): `createClient(await cookies())`; fetch `children` (mismas columnas) + `rooms`; busca el niño cuyo `slugify(full_name) === params.slug`; si no existe → `notFound()`. Renderiza datos reales:
  - Avatar (84px, ciclo de paleta por índice), nombre (Fredoka), "{N} años · Sala {Name}".
  - `<AllergyBox/>` solo si `allergy_tags.length > 0` o `medical_notes` no vacío; el texto lista las etiquetas traducidas (MANÍ, LACTOSA, …) + notas médicas. Sin datos → no se renderiza.
  - `<InfoRow/>` reales: "Fecha de nacimiento · 12 mar 2022", "Sala · Soles", "Ingreso · ago 2026" (última sin divisor).
  - Columna derecha: "Resumen del día" y "Editar" siguen visible-no-funcional (sin `href`). PADRES VINCULADOS: texto "Aún no hay padres vinculados" + `<LinkParentModal kidName={kid.fullName} />`; los mocks Lucía/Diego se eliminan.

**No incluye**

- Editar niño ni archivar (soft delete con `child_status`).
- Tabla `parent_children`, vínculo real padre↔niño, ni que "Guardar" del `LinkParentModal` persista (sigue visual, SPEC 05).
- Búsqueda por sala, alergia o filtros avanzados (solo por nombre).
- Foto del niño, subida de imágenes, `avatar_url`.
- "Resumen del día" real (sigue no funcional).
- Responsive móvil y dark mode.
- Modificar `app/page.tsx` (Feed), `app/login/`, `app/activate-account/`, `app/layout.tsx`, `app/_components/Sidebar.tsx`, `KidCard.tsx`, `AllergyBox.tsx`, `InfoRow.tsx`, `LinkedParent.tsx`, `LinkParentModal.tsx`, ni `utils/supabase/*`.
- Cualquier DDL (tablas, columnas, RLS, triggers, migraciones — todo en SPEC 10).

## Modelo de datos

Sin nuevas tablas ni columnas (cero DDL). Reusa `rooms` y `children` de SPEC 10. Tipos de view-model (serializables, server→client):

```ts
// app/_lib/kids.ts
export type RoomVm = { id: string; name: string };
export type KidCardVm = {
  slug: string;                                  // slugify(full_name)
  avatar: { letter: string; bg: string; color: string };
  name: string;                                  // full_name
  age: string;                                   // formatAgeYears(birth_date)
  linked: string;                               // siempre "sin padres vinculados"
  badge?: { label: "MANÍ" | "LACTOSA" | "VINCULAR" };
  roomId: string;
};
```

```ts
// app/_actions/kids.ts
"use server";
export async function createKid(input: {
  fullName: string;
  birthDate: string;      // "dd/mm/aaaa"
  roomId: string;
  allergiesText: string;  // "Maní, Lactosa"
  medicalNotes: string;
}): Promise<{ error?: string }>;
```

## Plan de implementación

1. **Crear `app/_lib/kids.ts`:** helpers puros (`slugify`, `formatAgeYears`, `formatBirthShort`, `formatEnrollShort`, `avatarForIndex`, `parseAllergyTags`, `allergyBadge`) + tipos `RoomVm`/`KidCardVm`. Verificar: `npx tsc --noEmit` ok.
2. **Modificar `app/kids/page.tsx`:** fetch `rooms` + `children` con `createClient(await cookies())`; construir `KidCardVm[]`; pasar `rooms` a `<AddKidModal>` y `{rooms, kids}` a `<KidsBrowser>`. El `<select>` del modal aún no llama al action (paso 3). Ver manual: `/kids` muestra 3 secciones "0 niños" con datos reales (vacío) y el select del modal carga Soles/Lunas/Estrellas desde la DB. `npx tsc --noEmit` ok.
3. **Crear `app/_actions/kids.ts` + cablear `AddKidModal`:** `createKid` con validación server-side mínima; "Guardar" llama `createKid`, `saving` + error inline; éxito → `close()` + reset y la lista se refresca por `revalidatePath`. Ver manual: crear "Martina López" (maní, sala Soles) → aparece en SALA SOLES con badge MANÍ; crear con fecha "31/02/2020" → error inline, no inserta. `npx tsc --noEmit` ok.
4. **Crear `app/_components/KidsBrowser.tsx`:** buscador funcional + 3 secciones + grilla + empty state "Aún no hay niños en esta sala". Ver manual: escribir "martina" filtra a 1 tarjeta; borrar restaura; salas vacías muestran el texto. `npx tsc --noEmit` ok.
5. **Modificar `app/kids/[slug]/page.tsx`:** perfil real con `notFound()` + `AllergyBox` condicional + InfoRows reales + PADRES VINCULADOS vacío honesto. Ver manual: clic en Martina → perfil real "2 años · Sala Soles", alergias MANÍ, ingreso "ago 2026"; `/kids/no-existe` → 404. `npx tsc --noEmit` ok.
6. **Verificar:** `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run build` sin errores. E2E manual (Playwright en `.playwright-mcp/`): login `javier@google.com`/`Abc123456` → `/kids` muestra 3 secciones "0 niños" → crear niño → aparece → buscar → clic → perfil real → slug basura 404. `/`, `/login`, `/activate-account` sin regresiones. Cero DDL → `supabase get_advisors` sin cambios vs. SPEC 10.

## Criterios de aceptación

- [ ] `/kids` muestra exactamente 3 secciones siempre visibles: "SALA SOLES · 0 niños", "SALA LUNAS · 0 niños", "SALA ESTRELLAS · 0 niños" (DB sin niños).
- [ ] Cada sala vacía muestra el texto "Aún no hay niños en esta sala" en `--color-ink-muted`.
- [ ] El `<select>` SALA del modal Agregar niño carga dinámicamente las 3 salas desde la DB, con Soles seleccionada por defecto.
- [ ] "Guardar" con nombre + fecha `dd/mm/aaaa` válidos inserta una fila en `public.children` (`enrolled_at` = hoy, `photo_consent` = true, `status` = 'active') y la tarjeta aparece en su sala sin recargar manualmente (`revalidatePath`).
- [ ] Alergias "Maní, Lactosa" se persisten como `{peanut,lactose}` y la tarjeta muestra badge MANÍ.
- [ ] Niño sin alergias muestra badge VINCULAR; toda tarjeta dice "sin padres vinculados".
- [ ] "Guardar" con nombre vacío o fecha inválida (ej. "31/02/2020") muestra error inline en `--color-primary-dark` y no inserta.
- [ ] El botón "Guardar" muestra "Guardando…" y se deshabilita durante el submit.
- [ ] El buscador filtra las tarjetas en vivo por nombre (case-insensitive) sin cambiar la URL.
- [ ] `/kids` sigue siendo Server Component; `KidsBrowser` y `AddKidModal` son las únicas islas client.
- [ ] `/kids/<slug-real>` muestra datos reales: avatar, nombre, "N años · Sala {Name}", `AllergyBox` (si hay datos), InfoRows (Fecha de nacimiento, Sala, Ingreso).
- [ ] `/kids/<slug-inexistente>` devuelve 404 (`notFound()`).
- [ ] Niño sin alergias ni notas médicas no renderiza `AllergyBox`.
- [ ] PADRES VINCULADOS muestra "Aún no hay padres vinculados" + botón "Vincular otro padre" (visual, SPEC 05); sin rastro de Lucía/Diego.
- [ ] "Editar" y "Resumen del día" siguen visible-no-funcionales.
- [ ] El mock `KIDS` y el mock `MATEO` (con Lucía/Diego) se eliminan.
- [ ] `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run build` sin errores.
- [ ] `/`, `/login`, `/activate-account` funcionan sin regresiones.
- [ ] Cero DDL (no se crean/modifican tablas, columnas, RLS, triggers, migraciones).

## Decisiones tomadas y descartadas

- **Yes:** split en dos specs (SPEC 10 migración + SPEC 11 UI). Sigue la regla AGENTS.md (DB specs en `specs/database/`, UI specs en raíz) y la convención 07/08 → 09.
- **No:** spec combinado. Mezcla responsabilidades y mete un spec de UI en `specs/database/`.
- **Yes:** Listar + Crear únicamente. "Mantenimiento" podría ser CRUD completo, pero no hay diseño de edición/archivado; el alta + lista real es el incremento honesto.
- **No:** editar/archivar ahora. Requiere diseñar modal de edición (no hay referencia) y policy `update`; va en spec propio.
- **Yes:** perfil real incluido. El usuario lo pidió; la pantalla `/kids/[slug]` ya existe (SPEC 02) y los datos provienen de la misma query.
- **No:** mantener perfil mock de Mateo. Mostraría datos falsos para niños reales.
- **Yes:** badge prioridad alergia > VINCULAR. La tarjeta tiene un solo slot de badge (SPEC 02); si hay alergia conocida (MANÍ/LACTOSA) gana, si no VINCULAR. La línea "sin padres vinculados" ya transmite el estado de vínculo.
- **No:** dos badges simultáneos. Rompería el diseño de `KidCard`.
- **Yes:** validación solo server-side en `createKid`. Mínimo para no romper la DB (nombre + fecha válida); el error se muestra inline. Coherente con SPEC 09 (validación en el action).
- **No:** validación client-side avanzada. Sin valor añadido para un form de 5 campos.
- **Yes:** fecha como `<input type="text">` "dd/mm/aaaa" + parse server-side estricto. Fidelidad a la referencia (SPEC 04); el parseo estricto (regex + fecha real + no futura) rechaza basura.
- **No:** `<input type="date">`. Se aleja del diseño de la referencia.
- **Yes:** slug derivado del nombre (no del id). El usuario lo pidió; la URL `/kids/martina-lopez` es legible.
- **No:** slug = id. URLs opacas; rompe la convención de SPEC 02.
- **Descartado:** colisión de slug (dos niños homónimos). Riesgo aceptado; gana el primero. El spec de edición o un perfil-por-id lo resolverá si llega.
- **Yes:** buscador client-side en `KidsBrowser`. N chico (una guardería); filtrar en vivo sin tocar la URL es la UX esperada.
- **No:** buscar en server con `searchParams`. Overkill para el volumen; perdería instantaneidad.
- **Yes:** isla client `KidsBrowser` (la página sigue Server). Mantiene el patrón de SPEC 02/04/06 (server page + isla client para interactividad).
- **No:** volver `/kids` `'use client'` entero. Serializaría queries innecesarias.
- **Yes:** `linked` fijo "sin padres vinculados" + badge VINCULAR. `parent_children` no existe; mostrar "0 padres" sería inventar. Honestar con "sin padres vinculados" y el badge VINCULAR existente.
- **No:** contar "0 padres vinculados". Sin tabla `parent_children` no hay qué contar.
- **Yes:** PADRES VINCULADOS vacío honesto + `LinkParentModal`. El modal ya existe (SPEC 05) y sigue visual; mostrar "Aún no hay padres vinculados" es honesto.
- **No:** mantener mocks Lucía/Diego. Inconsistente con datos reales.
- **Yes:** `AllergyBox` condicional. Si no hay alergias ni notas, no se muestra.
- **No:** `AllergyBox` siempre visible con "Sin alergias". Ruido visual.
- **Yes:** `revalidatePath('/kids', 'layout')` tras insertar. Refresca lista y subrutas en una sola llamada.
- **Yes:** defaults `enrolled_at`/`photo_consent`/`status` del schema. El form no los pide; los defaults cubren el alta.
- **Yes:** mapeo alergias ES→EN al guardar (maní→peanut). Cumple la convención del doc de referencia (datos persistidos en inglés).
- **No:** guardar alergias en español. Rompería la convención del schema.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Dos niños homónimos producen el mismo slug (`/kids/juan-perez` ambiguo) | Gana el primer match por `full_name` ordenado; documentado. El spec de edición o un perfil-por-id lo resolverá si llega |
| `dd/mm/aaaa` ambiguo vs `mm/dd` si el usuario escribe "05/06/2020" | Parseo estricto `dd/mm/aaaa` (día primero); rechaza fechas inválidas como "31/02/2020"; no hay ambigüedad porque el formato fija el orden |
| Mismatch server/client en formatos de fecha (Intl) | Los helpers son puros y corren con los mismos inputs en server y client; `es-ES` con meses en minúscula sin punto da resultado estable; los strings pre-formateados se pasan serializados al client |
| RLS abre lectura/escritura de `children` a cualquier autenticado del daycare (sin distinguir staff/parent) | Aceptado para una guardería con un solo staff; el spec de `parent_children` añadirá policies por rol |
| `AddKidModal` pierde el `Sala` hardcodeado y podría romper la fidelidad visual del select | El `<select>` dinámico reusa las mismas clases y chevron SVG de SPEC 04; verificar comparación visual |
| `revalidatePath('/kids', 'layout')` podría no refrescar `/kids/[slug]` dinámico | El modo `'layout'` cubre la ruta y subrutas; si no refresca, fallback a `revalidatePath('/kids/[slug]', 'page')` por cada slug (innecesario hoy) |

## Qué **no** está en este spec

- Editar niño ni archivar (soft delete con `child_status`).
- Tabla `parent_children`, vínculo real padre↔niño, ni que `LinkParentModal` persista.
- Búsqueda por sala, alergia o filtros avanzados.
- Foto del niño, subida de imágenes, `avatar_url`.
- "Resumen del día" real.
- Responsive móvil y dark mode.
- Modificar el Feed, login, `activate-account`, `layout`, `Sidebar`, `KidCard`, `AllergyBox`, `InfoRow`, `LinkedParent`, `LinkParentModal`, ni `utils/supabase/*`.
- Cualquier DDL (tablas, columnas, RLS, triggers, migraciones — todo en SPEC 10).

Cada uno de esos items, si se aborda, va en su propio spec.
