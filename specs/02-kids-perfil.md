**State:** Aprobado
**Depends on:** SPEC 01
**Date:** 2026-08-12

## Objetivo

Implementar las pantallas de Niños (lista) y Perfil de Niño (detalle) replicando `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html`, con datos mock estáticos, navegación real entre ambas y sin autenticación ni base de datos.

## Alcance

**Incluye**

- Crear ruta `/kids` (`app/kids/page.tsx`) que replica `ninos.dc.html`: header "GESTIÓN · Niños" + botón "Agregar niño", barra de búsqueda visual, separador "SALA SOLES · 8 niños" y grilla de 2 columnas con 8 tarjetas de niño.
- Crear ruta dinámica `/kids/[slug]` (`app/kids/[slug]/page.tsx`) que replica `perfil-nino.dc.html` con el mock de Mateo Fernández.
- Refactorizar `app/_components/Sidebar.tsx` con prop `active: "feed" | "ninos" | ...`; el enlace "Niños" apunta a `/kids`. "Feed" sigue activo en `/`.
- Ajustar `app/page.tsx`: `<Sidebar active="feed" />`.
- Extender `app/globals.css` `@theme` con tokens nuevos (avatars pink/green/yellow/purple, badges maní/vincular/activa/pendiente, bloque alergias).
- Componentes presentacionales nuevos: `KidCard.tsx`, `AllergyBox.tsx`, `LinkedParent.tsx`, `InfoRow.tsx`.
- Mock hardcoded idéntico a las plantillas (8 niños; Mateo con alergia, padres Lucía activa y Diego pendiente).
- Navegación funcional: sidebar "Niños" → `/kids`; cada `KidCard` → `/kids/<slug>`; "Volver a Niños" → `/kids`. Botones fuera de scope (Nueva publicación, Agregar niño, Editar, Resumen del día, Vincular otro padre, logout) **visibles no funcionales**.

**No incluye**

- Autenticación, base de datos, persistencia.
- Pantallas fuera de las dos referenciadas (Agregar niño, Resumen del día, Vincular padre, Avisos, Mi cuenta, etc.) — solo enlaces visuales no funcionales.
- Lógica real de búsqueda, edición, vínculo o resumen; filtro client-side.
- Perfil por niño más allá del mock de Mateo (todos los slugs renderizan Mateo).
- Responsive móvil y dark mode.

## Modelo de datos

Sin datos persistentes. Tipos locales por pantalla:

```ts
// app/kids/page.tsx
type KidBadge = { label: "MANÍ" | "LACTOSA" | "VINCULAR" };
type Kid = {
  slug: string;                      // "mateo-fernandez"
  avatar: { letter: string; bg: string; color: string };
  name: string;                      // "Mateo Fernández"
  age: string;                       // "3 años"
  linked: string;                    // "2 padres vinculados"
  badge?: KidBadge;
};
```

```ts
// app/kids/[slug]/page.tsx
type ParentStatus = "activa" | "pendiente";
type Parent = {
  avatar: { letter: string; bg: string; color: string };
  name: string;
  relation: string;                  // "Mamá" | "Papá"
  statusLabel: string;               // "activa" | "invitación enviada"
  status: ParentStatus;
};
type KidProfile = {
  avatar: { letter: string; bg: string; color: string };
  name: string;
  ageRoom: string;                   // "3 años · Sala Soles"
  allergy: { title: string; text: string };
  infoRows: { label: string; value: string }[];
  parents: Parent[];
};
```

Conventions: slugs kebab-case desde el nombre; colores de avatar indexados por niño (sky/pink/green/yellow/purple); badge ausente == chevron neutro.

## Plan de implementación

1. **Refactorizar `app/_components/Sidebar.tsx`:** prop `active?: "feed" | "ninos" | "avisos" | "cuenta"`; marcar el `NavItem` cuyo label coincida (fondo `#FBE3D8`, color `--color-primary`, `font-extrabold`). El enlace "Niños" obtiene `href="/kids"`; "Feed" mantiene `/`. Feed activo por defecto si no se pasa prop.
2. **Actualizar `app/page.tsx`:** `<Sidebar active="feed" />`. Ver manual: `npm run dev` carga `/` sin regresiones.
3. **Extender `app/globals.css` `@theme`:** tokens nuevos — `--color-avatar-pink-bg/color`, `--color-avatar-green-bg/color`, `--color-avatar-yellow-bg/color`, `--color-avatar-purple-bg/color`, `--color-badge-mani-bg/color` (`#FBD8CC`/`#D9684A`), `--color-badge-vincular-bg/color` (`#F9D2DE`/`#C56486`), `--color-badge-activa-bg/color` (`#CFEBD8`/`#3E9B6C`), `--color-badge-pendiente-bg/color` (`#F7E7A6`/`#9A7B1E`), `--color-alergias-bg` (`#FBDAD6`), `--color-alergias-icon-bg` (`#F4A8A0`), `--color-alergias-title` (`#C5413A`), `--color-alergias-text` (`#B25249`). Confirmar sintaxis Tailwind v4 con Context7.
4. **Crear `app/_components/InfoRow.tsx`:** fila label/value + divisor inferior `#F0E6D8`, última sin divisor. Props `{ label, value }`.
5. **Crear `app/_components/AllergyBox.tsx`:** contenedor `--color-alergias-bg`, ícono triángulo en `--color-alergias-icon-bg`, título + texto. Props `{ title, text }`.
6. **Crear `app/_components/LinkedParent.tsx`:** avatar + nombre + relación/statusLabel + badge estado (`activa`/`pendiente`). Slots/prop `addNew` para la variante "Vincular otro padre".
7. **Crear `app/_components/KidCard.tsx`:** `<Link href="/kids/[slug]">` con avatar, nombre (Fredoka), edad + padres, y a la derecha badge (MANÍ/LACTOSA/VINCULAR) o chevron neutro. Hover borde `#F2A78E` + `translateY(-2px)`, `transition:.15s`.
8. **Crear `app/kids/page.tsx`:** `<Sidebar active="ninos" />` + main scroll. Header "GESTIÓN / Niños" + "Agregar niño" (no funcional). Input búsqueda (no funcional). Separador "SALA SOLES · 8 niños". Grilla `grid-cols-2 gap-[14px]` con 8 `<KidCard/>` mock. Tipos `Kid` locales.
9. **Crear `app/kids/[slug]/page.tsx`:** recibe `params.slug`, renderiza siempre el mock de Mateo. `<Sidebar active="ninos" />` + main scroll. Link "Volver a Niños" → `/kids`. Dos columnas: izquierda (avatar 84px + nombre + "Editar" no funcional, `<AllergyBox/>`, lista `<InfoRow/>`), derecha 300px (botón "Resumen del día" no funcional bg `--color-ink`, bloque "PADRES VINCULADOS" con dos `<LinkedParent/>` + variante agregar). Tipos locales. Sin `generateStaticParams`.
10. **Verificar:** `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run dev` y comparación visual de `/kids` y `/kids/mateo-fernandez` contra `ninos.dc.html` y `perfil-nino.dc.html` (capturas Playwright en `.playwright-mcp/`).

## Criterios de aceptación

- [ ] `/kids` renderiza el sidebar de 248px con **Niños** activo (fondo `#FBE3D8`, color `--color-primary`, `font-extrabold`); Feed/Avisos/Mi cuenta inactivos.
- [ ] El enlace "Niños" del sidebar apunta a `/kids` y "Feed" a `/`; los `href` navegan.
- [ ] `/kids` muestra header "GESTIÓN / Niños" y botón naranja "Agregar niño" visible no funcional.
- [ ] `/kids` muestra el input de búsqueda con placeholder "Buscar niño…" e ícono lupa, visible no funcional (no filtra).
- [ ] `/kids` muestra el separador "SALA SOLES · 8 niños" con línea horizontal a la derecha.
- [ ] `/kids` muestra exactamente 8 tarjetas en grilla de 2 columnas, con nombres, colores de avatar, edades y textos de padres idénticos a la plantilla.
- [ ] Los badges MANÍ (Mateo), VINCULAR (Valentina) y LACTOSA (Tomás) se renderizan con los colores correctos; el resto muestra chevron neutro.
- [ ] Hover en una tarjeta cambia el borde a `#F2A78E` y la eleva `translateY(-2px)` con transición suave.
- [ ] Clic en cualquier `KidCard` navega a `/kids/<slug>` (ruta real) y renderiza el Perfil.
- [ ] `/kids/<slug>` muestra el perfil mock de Mateo Fernández sin importar el slug: avatar 84px sky, nombre "Mateo Fernández" (Fredoka), "3 años · Sala Soles", botón "Editar" visible no funcional.
- [ ] La caja de alergias muestra fondo `#FBDAD6`, ícono triángulo en `#F4A8A0`, título "Alergias y notas" en `#C5413A` y el texto "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila." en `#B25249`.
- [ ] La lista de datos muestra tres filas: "Fecha de nacimiento · 12 mar 2022", "Sala · Soles", "Ingreso · feb 2025" (última sin divisor).
- [ ] La columna derecha muestra el botón "Resumen del día" (fondo `--color-ink`, blanco) visible no funcional y el bloque "PADRES VINCULADOS".
- [ ] Lucía Fernández · Mamá · activa lleva badge "ACTIVA" (verde `#CFEBD8`/`#3E9B6C`); Diego Fernández · Papá · invitación enviada lleva badge "PENDIENTE" (amarillo `#F7E7A6`/`#9A7B1E`).
- [ ] El enlace "Vincular otro padre" muestra avatar punteado + ícono "+" y texto en `--color-primary-dark`, visible no funcional.
- [ ] El vínculo "Volver a Niños" navega a `/kids`.
- [ ] `npm run lint` pasa sin errores y `npx tsc --noEmit` no reporta tipos.
- [ ] Capturas de `/kids` y `/kids/mateo-fernandez` comparadas contra sus `.dc.html` coinciden en estructura, colores, tipografía y espaciados (revisión Playwright).
- [ ] Ningún botón fuera de scope ejecuta acción de backend ni navega.

## Decisiones tomadas y descartadas

- **Yes:** rutas en inglés `/kids` y `/kids/[slug]`. Convención idiomática para URLs; los labels UI ("Niños", "Agregar niño") siguen en español para fidelidad a la referencia.
- **No:** rutas en español `/ninos`. Inconsistente con el resto de paths del código (convención `@/*` en inglés).
- **Yes:** refactor único de `Sidebar` con prop `active` + `href` por item. Evita duplicar la barra y prepara Avisos/Mi cuenta futuros.
- **No:** duplicar Sidebar por pantalla. Mantenibilidad peor.
- **Yes:** extender `@theme` con tokens nuevos. Consistencia con SPEC 01 y reutilización futura.
- **No:** estilos inline para nuevos colores. Rompería la convención token-based.
- **Yes:** un único perfil mock (Mateo) para todos los slugs. La referencia solo detalla a Mateo; inventar 8 perfiles sería añadir datos no validados.
- **No:** mock con perfil básico por niño. Extrapolación fuera del alcance "solo diseño".
- **Yes:** buscador y botones de acción visibles no funcionales. Coherente con SPEC 01 y con el alcance "solo interfaces y componentes".
- **No:** filtro client-side. Cambiaría el alcance presentacional y requeriría `'use client'`.
- **Descartado:** `generateStaticParams`/SSG por niño — innecesario, mock único.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Tailwind v4 `@theme` sin config; añadir tokens nuevos puede romper sintaxis | Confirmar con Context7 antes del paso 3; validar con `npm run build`. |
| Ruta dinámica `/kids/[slug]` con mock único puede confundir (URL `sofia-mendez` muestra Mateo) | Documentado en alcance y criterio de aceptación. |
| Hover `translateY` + border en `KidCard` requiere transición CSS | Replicar `transition:.15s` de la plantilla. |
| Compartir `Sidebar` entre `/` y `/kids` puede introducir regresiones en Feed | Paso 2 verifica `/` sin cambios; captura comparativa de ambas rutas. |
| `next/font/google` ya configurado en SPEC 01 | No tocar `app/layout.tsx`. |

## Qué **no** está en este spec

- Pantallas de Agregar niño, Resumen del día, Vincular padre, Avisos, Mi cuenta y Crear publicación — solo aparecen como enlaces visuales no funcionales.
- Autenticación, base de datos, persistencia o lógica real de búsqueda/edición/vínculo.
- Datos por niño más allá del perfil mock de Mateo (las 8 tarjetas enlazan a `/kids/<slug>`, pero el contenido renderizado es siempre el de Mateo).
- Responsive móvil y dark mode.

Cada uno de esos items, si se aborda, va en su propio spec.