**State:** Aprobado
**Depends on:** —
**Date:** 2026-08-12

## Objetivo

Implementar la pantalla de Feed como home (`/`) replicando visualmente `references/pantallas/feed.dc.html` con datos mock estáticos, sin autenticación ni base de datos.

## Alcance

**Incluye**

- Reemplazar `app/page.tsx` por el Feed (sidebar fijo + main con feed) con estilos pixel-perfect a la plantilla.
- Cargar Fredoka y Nunito vía `next/font/google` en `app/layout.tsx` reemplazando Geist/Geist_Mono.
- Definir tokens de diseño (paleta terracota/cremas y fuentes) con `@theme` de Tailwind v4 en `app/globals.css`, más estilos base (body, scrollbar, links).
- Componentes presentacionales: `app/_components/Sidebar.tsx`, `app/_components/FeedPost.tsx`, `app/_components/QuickComposer.tsx`.
- Datos mock hardcodeados idénticos a la plantilla (Caro Giménez · Maestra · Soles, "12 niños · martes 17 jun", 3 posts: logro de Mateo, actividad con placeholder de foto, anuncio general) con contadores de likes/comentarios literales.
- Elementos interactivos (Nueva publicación, nav Niños/Avisos/Mi cuenta, Editar, logout, likes/comentarios) renderizados como visuales no funcionales (sin navegación ni handler real).

**No incluye**

- Autenticación, login o logout funcional.
- Base de datos o cualquier persistencia.
- Las demás pantallas (Niños, Avisos, Mi cuenta, Crear publicación, Detalle, Foto) — solo aparecen como enlaces visuales en el sidebar.
- Lógica real de likes, comentarios, edición o publicación.
- Responsive móvil y dark mode (la plantilla es desktop fijo sin dark mode).

## Modelo de datos

No hay datos persistentes ni nueva estructura de dominio. El mock se define como objetos TS tipados localmente (`Post`, `Badge`) dentro del código de la pantalla, sin almacenamiento.

## Plan de implementación

1. Actualizar `app/layout.tsx`: cargar Fredoka (wght 400–700) y Nunito (400–800 + italic 400) con `next/font/google`, exponer `--font-fredoka` y `--font-nunito`, aplicarlas a `<html>`/`<body>`, fondo `#F6ECDF`, `lang="es"`, metadata `title: "OpenDayCare · Feed"` y `description`.
2. Ampliar `app/globals.css`: `@import "tailwindcss"`, `@theme` con tokens de color (cremas, terracota, badges) y `--font-display/--font-body`, estilos base (body, `a { text-decoration:none }`, scrollbar webkit) replicando el `<style>` del template.
3. Crear `app/_components/Sidebar.tsx`: aside 248px sticky con logo "OpenDaycare · Sala Soles", botón "Nueva publicación" (naranja) y nav (Feed activo fondo `#FBE3D8`, Niños, Avisos, Mi cuenta) todos no funcionales; bloque inferior usuario "Caro Giménez · Maestra · Soles" con avatar "C" e ícono logout no funcional. SVGs de línea replicados.
4. Crear `app/_components/QuickComposer.tsx`: barra "Compartí un momento…" con avatar C e ícono cámara, link visual no funcional.
5. Crear `app/_components/FeedPost.tsx`: recibe props (avatar, nombre, hora, publicadoPor, badge `{logro|actividad|anuncio}`, audiencia, texto, `photo?`, likes, comments) y renderiza la card con badge de color correspondiente y footer (corazón + comentarios + "Editar"). Soporta variant placeholder de foto.
6. Reemplazar `app/page.tsx`: layout flex dos columnas (Sidebar + main scroll), header "GUARDERÍA · SALA SOLES / Buenas, Caro / 12 niños · martes 17 jun", `<QuickComposer/>`, separador "PUBLICADO HOY" y 3 `<FeedPost/>` con los datos mock idénticos a la plantilla.
7. Verificar: `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run dev` y comparación visual lado a lado con `references/pantallas/feed.dc.html` (captura Playwright en `.playwright-mcp/`).

## Criterios de aceptación

- [ ] `/` renderiza un sidebar fijo de 248px con logo "OpenDaycare · Sala Soles", botón naranja "Nueva publicación" y nav con Feed activo (fondo `#FBE3D8`), Niños, Avisos, Mi cuenta.
- [ ] El bloque inferior del sidebar muestra "Caro Giménez · Maestra · Soles" con avatar "C" e ícono de logout visible, todo no funcional.
- [ ] Bajo el header "Buenas, Caro" y "12 niños · martes 17 jun" aparece el compositor "Compartí un momento…" con avatar C e ícono de cámara.
- [ ] Se muestran exactamente 3 posts en orden: logro de Mateo (orinal), actividad de Mateo (témperas con placeholder de foto), anuncio general (parque), con los textos literales de la plantilla.
- [ ] Los badges LOGRO (verde `#CFEBD8`/`#3E9B6C`), ACTIVIDAD (celeste `#C7E7F1`/`#2E89A6`) y ANUNCIO (azul `#CCD8F4`/`#4E72C8`) se renderizan con los colores correctos.
- [ ] Se muestran contadores de corazones (3, 5, 8) y comentarios (1, 2, 0) coincidentes con la plantilla; link "Editar" por post visible (no funcional).
- [ ] El placeholder de foto del post de actividad muestra marco punteado, ícono de cámara y "Foto · pintando con témperas".
- [ ] Las tipografías body=Nunito y display (nombres/títulos)=Fredoka se cargan vía `next/font/google` (sin FOUP) con texto `#3F362E` y fondo `#F6ECDF`.
- [ ] `npm run lint` pasa sin errores y `npx tsc --noEmit` no reporta tipos.
- [ ] Captura de `/` comparada contra `feed.dc.html` coincide en estructura, colores, tipografía y espaciados (revisión manual Playwright).
- [ ] Ningún elemento navega a otra ruta real ni ejecuta acción de backend (links sin `href` funcional, sin `onClick` real).

## Decisiones tomadas y descartadas

- **Mock idéntico** a la plantilla (vs placeholders genéricos): maximiza fidelidad y permite comparar 1:1; la integración real de datos queda para un spec posterior.
- **Interacciones visuales no funcionales:** no hay backend ni rutas todavía; mantenerlas preserva el diseño sin simular comportamiento engañoso.
- **Tailwind v4 con `@theme` + utilidades** (vs estilos inline espejo): más mantenible e idiomático en este stack sin sacrificar cercanía pixel-perfect.
- **Separar en subcomponentes** (vs un único `page.tsx`): dado el volumen de JSX, mejora legibilidad y permite reutilizar `FeedPost` para las tres variantes.
- **Fredoka + Nunito vía `next/font/google`** reemplazando Geist: requerido para fidelidad tipográfica.
- **Descartado:** responsive móvil, dark mode y las demás pantallas referenciadas — cada una amerita su propio spec.

## Riesgos identificados

- Tailwind v4 usa `@theme` sin `tailwind.config.js`; conviene confirmar sintaxis con docs de Context7 antes de implementar los tokens.
- Replicar a mano los SVGs de línea (`<path>`) es propenso a errores; copiar los paths textuales de la plantilla.
- La plantilla usa `100vh` con scroll interno en el `main`; verificar que el sidebar quede fijo y el main sea el único que scrollea.
- `next/font/google` requiere acceso a Google Fonts en build; en entornos sin internet podría fallar (riesgo bajo).