**State:** Aprobado
**Depends on:** SPEC 02
**Date:** 2026-08-13

## Objetivo

Implementar el formulario "Agregar niño" como **modal** sobre la pantalla `/kids` que se abre al pulsar el botón "Agregar niño", replicando `references/pantallas/agregar-nino.dc.html`, con inputs reales editables, sin validación, sin autenticación, sin base de datos y sin persistencia — el botón "Guardar" cierra el modal sin alterar la lista mock de niños.

## Alcance

**Incluye**

- Crear `app/_components/AddKidModal.tsx` (`'use client'`): botón disparador (gradiente coral, ícono "+" y label "Agregar niño") + overlay modal centrado con backdrop oscuro (clic en backdrop o tecla ESC cierran) replicando el layout de `agregar-nino.dc.html`:
  - Header de la tarjeta: "Cancelar" (izquierda, `--color-ink-muted`) · "Agregar niño" (centro, Fredoka `text-[18px]`) · "Guardar" (derecha, `--color-primary`).
  - Campo NOMBRE COMPLETO: `<input>` con placeholder "Ej. Martina López".
  - Fila con dos columnas: FECHA DE NACIMIENTO (`<input type="text">`, placeholder "dd/mm/aaaa") y SALA (`<select>` nativo estilizado con exactamente 3 opciones `Soles` (default seleccionado), `Lunas`, `Estrellas`, más chevron SVG del `.dc.html`).
  - Campo ALERGIAS (ETIQUETAS): `<input>` de texto plano con placeholder "Ej. Maní, Lactosa" (no chips/tags).
  - Campo NOTAS MÉDICAS: `<textarea>` con placeholder "Indicaciones, medicación, contactos…".
- Inputs reales controlados con `useState` (vacíos al abrir; reset al cerrar). Autofocus en NOMBRE COMPLETO al abrir. Sin validación ni estados de error.
- "Cancelar", "Guardar", clic en backdrop y tecla ESC cierran el modal. Clics dentro de la tarjeta no propagan al backdrop (`stopPropagation`). El modal se renderea con `position:fixed inset-0 z-50` (overlay backdrop + tarjeta centrada) **sin** `createPortal`.
- Modificar `app/kids/page.tsx`: reemplazar el `<a tabIndex={0}>` "Agregar niño" estático por el disparador exportado por `<AddKidModal />`; el resto del JSX queda intacto (mock `KIDS`, sidebar, búsqueda, separador, grilla de 8 `<KidCard/>`).
- La página `/kids` permanece Server Component — el modal es una isla client (`<AddKidModal />`) importada; el resto del JSX de `/kids` no se serializa al cliente.
- Extender `app/globals.css` `@theme` con un único token nuevo `--color-modal-overlay: rgba(63,54,46,0.35)` (reutiliza los demás tokens existentes: `--color-auth-bg` (`#FBF4EC`), `--color-border-cream`, `--color-border-input`, `--color-ink`, `--color-ink-muted`, `--color-primary`, etc.).

**No incluye**

- Autenticación, base de datos, persistencia, ni modificación de la lista mock `KIDS`.
- Agregar el niño recién creado a la grilla de `/kids` (la acción "Guardar" es estrictamente visible-no-funcional, igual que SPEC 01-03).
- Validación client-side, estados de error, atributos `required` o mensajes de error.
- Datepicker nativo (`<input type="date">`) — el campo fecha es `<input type="text">` por fidelidad a la referencia.
- Tags/chips reales para alergias (es texto plano).
- Pantallas de **Vincular padre**, **Editar niño**, **Resumen del día**, **Familia-cuenta** o cualquier acción disparada desde la tarjeta de niño o el perfil.
- Responsive móvil y dark mode.
- Modificar `app/page.tsx`, `app/kids/[slug]/page.tsx`, `app/_components/Sidebar.tsx`, `app/layout.tsx`, ni las pantallas de `/login`, `/activate-account`.

## Modelo de datos

Sin datos persistentes. Estado local del modal (`useState`):

```ts
// app/_components/AddKidModal.tsx
type Sala = "Soles" | "Lunas" | "Estrellas";

const [open, setOpen] = useState(false);          // modal visible?
const [form, setForm] = useState({                 // reset a vacíos al abrir
  name: "",
  birthdate: "",                                   // texto "dd/mm/aaaa"
  sala: "Soles" as Sala,                            // default
  allergies: "",
  medicalNotes: "",
});
```

La lista `KIDS` en `app/kids/page.tsx` no se toca — el mock permanece intacto. `form` se reinicia al estado vacío (con `sala: "Soles"`) cada vez que `open` pasa a `true` o a `false`.

## Plan de implementación

1. **Extender `app/globals.css` `@theme`:** añadir un único token `--color-modal-overlay: rgba(63,54,46,0.35)`. Los demás colores del modal ya existen como tokens (`--color-auth-bg`, `--color-border-cream`, `--color-border-input`, `--color-ink*`, `--color-primary`). Confirmar sintaxis Tailwind v4 con Context7. Verificar: `npm run lint` y `npx tsc --noEmit` sin errores.
2. **Crear `app/_components/AddKidModal.tsx` (`'use client'`):** exportación por defecto que renderea el botón disparador + (cuando `open === true`) el overlay:
   - Overlay: `<div className="fixed inset-0 z-50 flex items-start justify-center p-[40px_24px]" style={{background:"var(--color-modal-overlay)"}}>` con `onClick={() => close()}`.
   - Tarjeta: `<div onClick={(e) => e.stopPropagation()} className="w-full max-w-[520px] bg-auth-bg border border-border-cream rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">` — fondo `--color-auth-bg`, borde `--color-border-cream`, sombra idéntica al `.dc.html`.
   - Header: `flex items-center justify-between px-[26px] py-5 border-b border-border-cream` — `<button type="button">Cancelar</button>` (ink-muted, `text-[15px] font-bold`), `<span>Agregar niño</span>` (Fredoka, `text-[18px] font-semibold text-ink`), `<button type="button">Guardar</button>` (primary, `text-[15px] font-extrabold`).
   - Cuerpo `px-[26px] py-6`:
     - Label "NOMBRE COMPLETO" (estilo label) + `<input autoFocus />` con `form.name`.
     - Grid `flex gap-[14px]`: izquierda FECHA DE NACIMIENTO + `<input type="text">` placeholder "dd/mm/aaaa" con `form.birthdate`; derecha SALA — `<select>` envoltorio con `appearance-none`, opciones `Soles`/`Lunas`/`Estrellas` y `<svg>` chevron replica del `.dc.html`.
     - Label "ALERGIAS (ETIQUETAS)" + `<input>` placeholder "Ej. Maní, Lactosa" con `form.allergies`.
     - Label "NOTAS MÉDICAS" + `<textarea className="min-h-[90px] resize-vertical">` placeholder "Indicaciones, medicación, contactos…" con `form.medicalNotes`.
   - Inputs controlados: `value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}` y análogos para cada campo. Los `<select>` y `<textarea>` también controlados. No hay `<form>` real — todos los botones son `type="button"`.
   - `close()`: `setOpen(false)` + `setForm({name:"", birthdate:"", sala:"Soles", allergies:"", medicalNotes:""})`.
   - ESC: `useEffect(() => { if (!open) return; const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open]);`.
   - Disparador: `<button type="button" onClick={() => setOpen(true)} className="...">` replicando el botón actual de `/kids` (gradiente `linear-gradient(180deg, var(--color-primary-gradient-from), var(--color-primary-gradient-to))`, sombra `0 8px 18px -8px rgba(238,129,100,0.7)`, ícono "+" blanco, label "Agregar niño").
   - Verificar: `npx tsc --noEmit` ok.
3. **Modificar `app/kids/page.tsx`** (sin añadir `'use client'`): reemplazar el `<a tabIndex={0} className="...">Agregar niño</a>` actual (líneas 93-110) por `<AddKidModal />`. Importarlo arriba: `import { AddKidModal } from "../_components/AddKidModal";`. Header, búsqueda, separador "SALA SOLES · 8 niños" y grilla de 8 `<KidCard/>` intocados. Ver manual: cargar `/kids`, clic en "Agregar niño" abre el modal sobre la página sin cambiar la URL.
4. **Verificar:** `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run dev` y comparación visual lado a lado entre el modal abierto y `references/pantallas/agregar-nino.dc.html` (capturas Playwright en `.playwright-mcp/`). Comprobar además que:
   - ESC cierra el modal y resetea el formulario.
   - Clic en el backdrop oscuro cierra el modal; clics dentro de la tarjeta no.
   - "Cancelar" y "Guardar" cierran el modal sin cambiar la URL ni agregar items a la grilla — `KIDS` sigue con 8 niños.
   - Los inputs aceptan texto; el `<select>` de Sala abre y permite elegir entre Soles/Lunas/Estrellas; al reabrir, todos los campos están vacíos.
   - `/`, `/kids/<slug>`, `/login`, `/activate-account` funcionan sin regresiones.

## Criterios de aceptación

- [ ] El botón "Agregar niño" de `/kids` (gradiente coral, ícono "+", label "Agregar niño") al pulsarlo abre un modal sobre la página en la misma URL (`/kids`); la URL no cambia.
- [ ] El modal oscurece el fondo (overlay `--color-modal-overlay` `rgba(63,54,46,0.35)`) y centra una tarjeta de `max-width: 520px` con `border-radius: 24px`, sombra `0 20px 50px -24px rgba(63,54,46,0.35)`, fondo `--color-auth-bg` (`#FBF4EC`) y borde `--color-border-cream` (`#ECE0D0`), idéntica a la referencia.
- [ ] El header del modal muestra "Cancelar" (izquierda, `--color-ink-muted`), "Agregar niño" (centro, Fredoka `text-[18px]`) y "Guardar" (derecha, `--color-primary`), con la distribución justify-between de `agregar-nino.dc.html`.
- [ ] El cuerpo muestra los 5 campos en el orden de la referencia: NOMBRE COMPLETO, FECHA DE NACIMIENTO, SALA, ALERGIAS (ETIQUETAS), NOTAS MÉDICAS, con labels en mayúsculas y `letter-spacing` idénticos a la plantilla (`text-[12px] font-extrabold tracking-[0.7px] text-ink-muted`).
- [ ] NOMBRE COMPLETO es un `<input>` con placeholder "Ej. Martina López" y recibe `autoFocus` al abrirse el modal.
- [ ] FECHA DE NACIMIENTO es un `<input type="text">` con placeholder "dd/mm/aaaa" (sin datepicker nativo).
- [ ] SALA es un `<select>` nativo estilizado con un chevron SVG a la derecha y exactamente 3 opciones: `Soles` (default seleccionado), `Lunas`, `Estrellas`. Se puede abrir y elegir.
- [ ] ALERGIAS (ETIQUETAS) es un `<input>` simple de texto con placeholder "Ej. Maní, Lactosa" — no chips ni tags.
- [ ] NOTAS MÉDICAS es un `<textarea>` de `min-height: 90px` y `resize: vertical` con placeholder "Indicaciones, medicación, contactos…".
- [ ] Todos los inputs y el `<select>` son editables (estado controlado con `useState`); al escribir o elegir, los valores se actualizan.
- [ ] Pulsar ESC cierra el modal y resetea el formulario a vacío (con `sala: "Soles"`).
- [ ] Clic en el backdrop oscuro cierra el modal; clics dentro de la tarjeta NO cierran (`stopPropagation`).
- [ ] Clic en "Cancelar" cierra el modal sin efectos sobre la lista `/kids`.
- [ ] Clic en "Guardar" cierra el modal sin persistir nada y sin agregar el niño a la grilla — `KIDS` sigue mostrando los 8 niños originales.
- [ ] Reabrir el modal tras cerrarlo muestra todos los campos vacíos (estado reset).
- [ ] No hay validación client-side, atributos `required`, ni mensajes de error visibles (conforme a SPEC 03).
- [ ] `/kids` sigue siendo Server Component; el modal es la única isla client (`<AddKidModal />` importado); el resto del JSX de `/kids` no se serializa al cliente.
- [ ] `app/_components/AddKidModal.tsx` es el único componente nuevo; `app/kids/page.tsx` solo cambia el disparador "Agregar niño" (y añade el import); el resto de archivos de SPEC 01-03 no se modifican.
- [ ] `app/globals.css` solo añade el token `--color-modal-overlay`; el resto de `@theme` queda intacto.
- [ ] `npm run lint` pasa sin errores; `npx tsc --noEmit` no reporta tipos.
- [ ] Captura del modal abierto comparada contra `agregar-nino.dc.html` coincide en estructura, colores, tipografía y espaciados (revisión Playwright en `.playwright-mcp/`).
- [ ] `/`, `/kids/[slug]`, `/login` y `/activate-account` funcionan sin regresiones; no se navega a otra ruta al abrir/cerrar el modal.

## Decisiones tomadas y descartadas

- **Yes:** modal sobre `/kids` (sin nueva ruta). Coincide con la descripción del usuario "es un modal"; mantiene la lista visible detrás y evita una URL de altas.
- **No:** ruta `/kids/new`. La referencia original del `.dc.html` usaba enlaces `Cancelar`/`Guardar` a `ninos.dc.html`, pero el usuario describió el componente como modal.
- **Yes:** "Guardar" es estrictamente visible-no-funcional (cierra sin persistir ni modificar `KIDS`). Consistencia con el patrón de SPEC 01-03 (botones fuera de scope no ejecutan backend).
- **No:** agregar el niño a la grilla en memoria ni persistir en localStorage. Cambiaría el alcance del spec y requeriría volver `/kids` `'use client'` para manejar `KIDS` como estado.
- **Yes:** `<select>` nativo con 3 opciones `Soles`/`Lunas`/`Estrellas` y `"Soles"` default. Combo funcional para mostrar el dropdown abierto sin inventar 5 opciones; mantiene la temática celestial de "Sala Soles".
- **No:** datepicker nativo (`<input type="date">`). La referencia usa placeholder "dd/mm/aaaa" — se mantiene `<input type="text">` por fidelidad.
- **Yes:** Alergias como input de texto plano. Fidelidad estricta a `agregar-nino.dc.html` (que muestra un `<input>` simple); el label "(ETIQUETAS)" es decorativo.
- **No:** chips/tags reales para alergias. Rompe el patrón "solo diseño" y requiere estado adicional.
- **Yes:** cierre con ESC, backdrop y botones Cancelar/Guardar. UX estándar de modal; el clic interno no propaga al backdrop (`stopPropagation`).
- **No:** ícono × en la esquina. La referencia no lo tiene; la cabecera "Cancelar/Guardar" ya ofrece cierres visibles.
- **Yes:** sin validación client-side. Consistencia con SPEC 03 (login/activar sin validar).
- **No:** `required`, mensajes de error o estados `aria-invalid`. Sin backend no hay nada que validar.
- **Yes:** estado del formulario reseteado al abrir. Comportamiento natural de un modal de altas fresh; evita confusiones.
- **No:** conservar el texto escrito entre aperturas. Sin persistencia no hay razón para mantenerlo.
- **Yes:** `/kids` permanece Server Component; `<AddKidModal />` es la única isla client. Mantiene el patrón Next.js de islas de interactividad y no serializa más JS del necesario.
- **No:** volver `/kids` `'use client'` entero. Innecesario — el mock `KIDS` y los `<KidCard/>` son presentacionales.
- **Yes:** modal renderizado en árbol (sin `createPortal`) con `position:fixed inset-0 z-50`. Suficiente por z-index; menos complejidad que un portal.
- **No:** `createPortal` a `document.body`. Agrega dependencia al DOM y manejo extra de SSR.
- **Yes:** reutilizar tokens existentes + un único nuevo `--color-modal-overlay`. Los tokens `--color-auth-bg`/`--color-border-cream`/`--color-border-input`/`--color-ink*`/`--color-primary` ya cubren el modal.
- **No:** estilos inline espejo para los colores del modal. Rompería la convención token-based de SPEC 01-03.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Mezclar Server (`/kids`) con Client (`AddKidModal`) puede disparar warnings de hidratación | El componente client es el único interactivo; el modal solo existe cuando `open === true`. Verificar con `npm run build`. |
| El `<select>` nativo estilizado puede no renderizar idéntico al chevron custom de la referencia | Replicar el chevron SVG como `<svg>` decorativo y aplicar `appearance-none` sobre el `<select>`; validar comparación visual contra `agregar-nino.dc.html`. |
| ESC global puede colisionar si el usuario tiene handlers de keyboard en otra parte | Registrar/desregistrar el listener `keydown` solo cuando `open === true` (cleanup en `useEffect`). |
| Sin `createPortal`, el overlay `fixed` dentro de un `<main>` con `overflow-y-auto` puede renderizarse recortado | `position:fixed` se resuelve contra el viewport, no el ancestro `overflow` (no se recorta). Verificar en `.playwright-mcp/`. |
| `autoFocus` puede saltar antes de que el modal sea visible (flash de scroll) | `<input autoFocus>` solo se monta cuando `open === true`; sin animación de entrada para minimizar complejidad. |
| Reemplazar el `<a tabIndex={0}>` actual por un `<button>` puede alterar el foco/estilo | Replicar exactamente las clases del `<a>` actual sobre el `<button type="button">`; verificar compare con `/kids` antes/después. |
| `next/font/google` ya configurado en SPEC 01 | No tocar `app/layout.tsx`. |

## Qué **no** está en este spec

- Autenticación, base de datos, persistencia, ni modificación de la lista mock `KIDS`.
- Agregar el niño recién creado a la grilla de `/kids` (acción "Guardar" visible-no-funcional, conforme a SPEC 01-03).
- Validación client-side, estados de error, atributos `required`, mensajes de error.
- `<input type="date">` con calendario nativo (se usa `<input type="text">` por fidelidad).
- Tags/chips reales para alergias (texto plano).
- Pantallas de **Vincular padre**, **Editar niño**, **Resumen del día**, **Familia-cuenta** o cualquier acción disparada desde la tarjeta de niño o el perfil.
- Responsive móvil y dark mode.
- Modificar `/` (Feed), `/kids/[slug]`, `app/_components/Sidebar.tsx`, `app/layout.tsx`, o las pantallas de `/login`, `/activate-account`.

Cada uno de esos items, si se aborda, va en su propio spec.