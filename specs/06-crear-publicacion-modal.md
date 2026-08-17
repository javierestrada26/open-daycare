**State:** Aprobado
**Depends on:** SPEC 01, SPEC 04
**Date:** 2026-08-17

## Objetivo

Implementar el modal "Nueva publicación" que se abre al pulsar "Nueva publicación" en el `Sidebar`, replicando `references/pantallas/crear-publicacion.dc.html`, con pills PARA (single-select, default Mateo), pills TIPO (single-select, default Actividad), `<textarea>` DESCRIPCIÓN y sección FOTOS estática — sin autenticación, backend ni persistencia; "Publicar" es visible-no-funcional.

## Alcance

**Incluye**

- Crear `app/_components/NewPostModal.tsx` (`'use client'`): botón disparador (gradiente coral, ícono "+" y label "Nueva publicación") + overlay modal centrado con backdrop (clic en backdrop o ESC cierran) replicando `crear-publicacion.dc.html`:
  - Tarjeta: `max-width:580px`, fondo `--color-auth-bg` (`#FBF4EC`), borde `--color-border-cream` (`#ECE0D0`), `border-radius:24px`, sombra `0 20px 50px -24px rgba(63,54,46,.35)`.
  - Header `justify-between`: "Cancelar" (izq., `--color-ink-muted` `text-[15px] font-bold`) · "Nueva publicación" (centro, Fredoka `text-[18px] font-semibold text-ink`) · "Publicar" (der., `--color-primary` `text-[15px] font-extrabold`). "Cancelar" y "Publicar" cierran el modal. Sin botón × (la referencia no lo tiene).
  - Cuerpo `px-[26px] py-6`:
    - **PARA**: label + 4 `<button type="button">` pill `rounded-full` con avatar circular 26×26. Mateo (activa por default: borde `1.5px solid --color-ink` (`#3F362E`), fondo `--color-ink`, texto blanco, avatar `--color-avatar-sky-bg`/`--color-avatar-sky` (`#A9D9E8`/`#1F7A93`)). Sofía (inactiva: borde `--color-border-cream`, fondo `--color-surface` (`#FFFDF9`), texto `--color-ink-soft` (`#6E6359`), avatar `--color-avatar-pink-bg`/`--color-avatar-pink` (`#F4B8CC`/`#C44A7A`)). Benjamín (inactiva: avatar `--color-avatar-green-bg`/`--color-avatar-green` (`#B9DEC4`/`#3E8B62`)). "Toda la sala" (inactiva: sin avatar, solo texto). Single-select mutuamente excluyente.
    - **TIPO**: label + 7 `<button type="button">` pill `rounded-full` sin borde, cada una con su color propio (todas muestran su color completo, igual que la referencia): Comida (bg `--color-tipo-comida` (`#9A7B1E`), texto blanco), Siesta (bg `--color-tipo-siesta-bg` (`#E7DCF6`), texto `--color-tipo-siesta` (`#7B5FC0`)), Actividad (bg `--color-badge-actividad` (`#2E89A6`), texto blanco), Logro (bg `--color-badge-logro-bg` (`#CFEBD8`), texto `--color-badge-logro` (`#3E9B6C`)), Ánimo (bg `--color-tipo-animo-bg` (`#F9D2DE`), texto `--color-tipo-animo` (`#C56486`)), Foto (bg `--color-tipo-foto-bg` (`#FBD8CC`), texto `--color-tipo-foto` (`#D9684A`)), Anuncio (bg `--color-badge-anuncio-bg` (`#CCD8F4`), texto `--color-badge-anuncio` (`#4E72C8`)). Single-select, default "Actividad". La pill seleccionada lleva un anillo indicador (`outline outline-2 outline-offset-[3px] outline-ink`) para señalar la selección (la referencia no muestra estado inactivo, así que todas se ven coloreadas y el anillo marca la activa).
    - **DESCRIPCIÓN**: label + `<textarea>` vacío, placeholder "Contá cómo le fue hoy…", `min-h-[120px]`, `resize-y`, padding `14px 16px`, `rounded-[14px]`, borde `1.5px solid --color-border-input` (`#EADFD0`), fondo blanco, `text-[15px] leading-[1.5]`.
    - **FOTOS**: label + 2 cajas 96×96 `rounded-[14px]` estáticas no funcionales. Caja 1 ("foto ya subada"): fondo `--color-photo-tile-bg` (`#F4ECE1`), borde `1px solid --color-border-cream`, ícono imagen en `--color-photo-tile-icon` (`#CBB89F`). Caja 2 ("Agregar"): fondo `--color-photo-tile-bg`, borde `1.5px dashed --color-photo-add-border` (`#DBCDBA`), ícono "+" en `--color-primary-dark` (`#C5503A`) y label "Agregar" `text-[12px]` en `--color-ink-placeholder` (`#B0A290`). Ninguna abre file picker.
- Estado controlado con `useState` (reset al cerrar): `recipient` (`"Mateo" | "Sofía" | "Benjamín" | "Toda la sala"`, default `"Mateo"`), `tipo` (`"Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio"`, default `"Actividad"`), `descripcion` (string, default `""`). Sin `<form>` real — todos los botones `type="button"`. Sin autofocus (la primera pieza interactiva es una pill, no un input; se evita salto de scroll).
- Cierre: "Cancelar", "Publicar", clic en backdrop y tecla ESC. Clics dentro de la tarjeta no propagan (`stopPropagation`). Modal rendereado con `position:fixed inset-0 z-50` sin `createPortal` (mismo patrón que AddKidModal/LinkParentModal).
- Modificar `app/_components/Sidebar.tsx`: reemplazar el `<a tabIndex={0}>` "Nueva publicación" (líneas 63-80) por `<NewPostModal />`; añadir import `import { NewPostModal } from "./NewPostModal";`. `Sidebar` permanece Server Component — el modal es la única isla client importada; el resto del JSX del Sidebar (logo, nav, bloque usuario) queda intacto.
- Extender `app/globals.css` `@theme` con 10 tokens nuevos: `--color-tipo-comida` (`#9A7B1E`), `--color-tipo-siesta-bg` (`#E7DCF6`), `--color-tipo-siesta` (`#7B5FC0`), `--color-tipo-animo-bg` (`#F9D2DE`), `--color-tipo-animo` (`#C56486`), `--color-tipo-foto-bg` (`#FBD8CC`), `--color-tipo-foto` (`#D9684A`), `--color-photo-tile-bg` (`#F4ECE1`), `--color-photo-tile-icon` (`#CBB89F`), `--color-photo-add-border` (`#DBCDBA`). Reutilizar `--color-modal-overlay` (SPEC 04), `--color-badge-actividad`/`--color-badge-logro(-bg)`/`--color-badge-anuncio(-bg)` (SPEC 01), `--color-avatar-sky(-bg)`/`--color-avatar-pink(-bg)`/`--color-avatar-green(-bg)` (SPEC 01), y los tokens estructurales `--color-auth-bg`/`--color-border-cream`/`--color-border-input`/`--color-surface`/`--color-ink`/`--color-ink-soft`/`--color-ink-muted`/`--color-ink-placeholder`/`--color-primary`/`--color-primary-dark`/`--color-primary-gradient-from`/`--color-primary-gradient-to`.

**No incluye**

- Autenticación, backend, persistencia, ni agregado de ningún post al feed de `/` (la acción "Publicar" es estrictamente visible-no-funcional, igual que SPEC 01-05).
- File picker real ni subida de fotos (las cajas FOTOS son estático-visuales).
- Validación client-side, estados de error, atributos `required` o mensajes de error.
- Que "Compartí un momento…" (`QuickComposer`) abra el modal — sigue siendo visual no funcional.
- Editar posts, detalle de publicación, pantalla de Foto, Avisos, Mi cuenta o cualquier otra acción del Sidebar/nav.
- Responsive móvil y dark mode.
- Modificar `app/page.tsx`, `app/kids/page.tsx`, `app/kids/[slug]/page.tsx`, `app/_components/QuickComposer.tsx`, `app/layout.tsx`, ni las pantallas de `/login`, `/activate-account`.

## Modelo de datos

Sin datos persistentes. Estado local del modal (`useState`):

```ts
// app/_components/NewPostModal.tsx
type Recipient = "Mateo" | "Sofía" | "Benjamín" | "Toda la sala";
type Tipo = "Comida" | "Siesta" | "Actividad" | "Logro" | "Ánimo" | "Foto" | "Anuncio";

const EMPTY_FORM = {
  recipient: "Mateo" as Recipient,   // default seleccionada
  tipo: "Actividad" as Tipo,          // default seleccionada
  descripcion: "",
};

const [open, setOpen] = useState(false);
const [form, setForm] = useState(EMPTY_FORM);
```

Pills PARA hardcodeadas en el componente (mock idéntico a la referencia, sin acoplar al mock `KIDS` de `app/kids/page.tsx`):

```ts
const RECIPIENTS: { id: Recipient; label: string; avatar?: { letter: string; bgVar: string; colorVar: string } }[] = [
  { id: "Mateo",    label: "Mateo",    avatar: { letter: "M", bgVar: "var(--color-avatar-sky-bg)",   colorVar: "var(--color-avatar-sky)" } },
  { id: "Sofía",    label: "Sofía",    avatar: { letter: "S", bgVar: "var(--color-avatar-pink-bg)",  colorVar: "var(--color-avatar-pink)" } },
  { id: "Benjamín", label: "Benjamín", avatar: { letter: "B", bgVar: "var(--color-avatar-green-bg)", colorVar: "var(--color-avatar-green)" } },
  { id: "Toda la sala", label: "Toda la sala" },
];
```

`form` se reinicia a `EMPTY_FORM` cada vez que `open` cambia a `false`.

## Plan de implementación

1. **Extender `app/globals.css` `@theme`:** añadir 10 tokens — `--color-tipo-comida: #9A7B1E`, `--color-tipo-siesta-bg: #E7DCF6`, `--color-tipo-siesta: #7B5FC0`, `--color-tipo-animo-bg: #F9D2DE`, `--color-tipo-animo: #C56486`, `--color-tipo-foto-bg: #FBD8CC`, `--color-tipo-foto: #D9684A`, `--color-photo-tile-bg: #F4ECE1`, `--color-photo-tile-icon: #CBB89F`, `--color-photo-add-border: #DBCDBA`. Reutilizar `--color-modal-overlay` (SPEC 04) y los tokens de avatar/badge/estructurales ya existentes. Confirmar sintaxis Tailwind v4 con Context7. Verificar: `npm run lint` y `npx tsc --noEmit` sin errores.
2. **Crear `app/_components/NewPostModal.tsx` (`'use client'`):** exportación por defecto `NewPostModal()` (sin props). Renderea el disparador + (cuando `open === true`) el overlay:
   - Disparador: `<button type="button" onClick={() => setOpen(true)}>` replicando exactamente las clases del `<a>` actual del Sidebar (gradiente `linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))`, `shadow-[0_8px_18px_-8px_rgba(238,129,100,0.75)]`, ícono "+" blanco, label "Nueva publicación", `flex items-center justify-center gap-2 w-full p-3 rounded-[14px] text-white font-extrabold text-[14.5px] mb-[18px]`).
   - Overlay: `<div className="fixed inset-0 z-50 flex items-start justify-center p-[40px_24px]" style={{background:"var(--color-modal-overlay)"}} onClick={close}>`.
   - Tarjeta: `<div onClick={(e)=>e.stopPropagation()} className="w-full max-w-[580px] bg-auth-bg border border-border-cream rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">` — `max-width:580px` (la referencia usa 580, distinto de AddKidModal 520 y LinkParentModal 480).
   - Header: `flex items-center justify-between px-[26px] py-5 border-b border-border-cream` — `<button type="button" onClick={close}>Cancelar</button>` (`text-ink-muted text-[15px] font-bold`), `<span>Nueva publicación</span>` (`font-display text-[18px] font-semibold text-ink`), `<button type="button" onClick={close}>Publicar</button>` (`text-primary text-[15px] font-extrabold`).
   - Cuerpo `px-[26px] py-6`:
     - Label "PARA" (`text-[12px] font-extrabold tracking-[0.7px] text-ink-muted mb-[10px]`) + `<div className="flex flex-wrap gap-[9px] mb-[22px]">` con 4 `<button type="button">` pill. Cada pill: `flex items-center gap-2 py-[6px] pr-[14px] pl-[6px] rounded-full border-[1.5px] font-bold text-[14px]`. Activa (`form.recipient === id`): `border-ink bg-ink text-white`; inactiva: `border-border-cream bg-surface text-ink-soft`. Avatar 26×26 `rounded-full font-display font-semibold text-[13px]` con `style={{background, color}}` del token correspondiente. "Toda la sala" sin avatar: `py-[6px] px-[16px]`. `onClick` setea `form.recipient`.
     - Label "TIPO" + `<div className="flex flex-wrap gap-[9px] mb-[22px]">` con 7 `<button type="button">` pill `py-[8px] px-[16px] rounded-full border-none font-extrabold text-[13.5px]`. Cada una con `style={{background, color}}` según el token del tipo (Comida/Siesta/Actividad/Logro/Ánimo/Foto/Anuncio). La seleccionada (`form.tipo === id`) añade `outline outline-2 outline-offset-[3px] outline-ink`. `onClick` setea `form.tipo`.
     - Label "DESCRIPCIÓN" + `<textarea value={form.descripcion} onChange={(e)=>setForm({...form, descripcion:e.target.value})} placeholder="Contá cómo le fue hoy…" className="w-full min-h-[120px] resize-y px-[16px] py-[14px] rounded-[14px] border-[1.5px] border-solid border-border-input bg-white text-[15px] text-ink leading-[1.5] outline-none mb-[22px]" />`.
     - Label "FOTOS" + `<div className="flex gap-[12px]">` con 2 cajas 96×96 estáticas (markup decorativo, sin `onClick`): caja 1 (`bg-photo-tile-bg border border-border-cream rounded-[14px] flex items-center justify-center text-photo-tile-icon` + `<svg>` imagen), caja 2 (`bg-photo-tile-bg border-[1.5px] border-dashed border-photo-add-border rounded-[14px] flex flex-col items-center justify-center gap-[6px] text-ink-placeholder` + `<svg>` "+" en `text-primary-dark` + `<span className="text-[12px]">Agregar</span>`).
   - `close()`: `setOpen(false)` + `setForm(EMPTY_FORM)`.
   - ESC: `useEffect(() => { if (!open) return; const onKey = (e) => e.key === "Escape" && close(); window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open, close]);` (mismo patrón que AddKidModal).
   - Verificar: `npx tsc --noEmit` ok.
3. **Modificar `app/_components/Sidebar.tsx`** (sin añadir `'use client'`): reemplazar el `<a tabIndex={0} className="...">Nueva publicación</a>` (líneas 63-80) por `<NewPostModal />`. Añadir import arriba: `import { NewPostModal } from "./NewPostModal";`. Logo, nav (`NavItem`), bloque usuario y logout quedan intactos. `Sidebar` permanece Server Component (renderiza la isla client `<NewPostModal />`). Ver manual: cargar `/`, `/kids`, `/kids/mateo-fernandez` y pulsar "Nueva publicación" en cada una — el modal abre sobre la página sin cambiar la URL.
4. **Verificar:** `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run dev` y comparación visual lado a lado entre el modal abierto y `references/pantallas/crear-publicacion.dc.html` (capturas Playwright en `.playwright-mcp/`). Comprobar además que:
   - "Cancelar" y "Publicar" cierran el modal y resetean el formulario a `{recipient:"Mateo", tipo:"Actividad", descripcion:""}`.
   - ESC cierra; clic en backdrop cierra; clics dentro de la tarjeta no.
   - Las pills PARA son single-select (Mateo default); las pills TIPO son single-select (Actividad default con anillo indicador); el `<textarea>` acepta texto; al reabrir, todo vuelve al estado inicial.
   - Las cajas FOTOS no abren ningún file picker.
   - `/`, `/kids`, `/kids/[slug]`, `/login` y `/activate-account` funcionan sin regresiones; no se navega a otra ruta al abrir/cerrar el modal.

## Criterios de aceptación

- [ ] Pulsar "Nueva publicación" en el Sidebar abre un modal sobre la página en la misma URL, desde `/`, `/kids` y `/kids/[slug]`; la URL no cambia.
- [ ] El disparador mantiene el aspecto exacto del `<a>` original: gradiente `linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))`, sombra `0 8px 18px -8px rgba(238,129,100,0.75)`, ícono "+" blanco y label "Nueva publicación" `font-extrabold text-[14.5px]`.
- [ ] El modal oscurece el fondo (overlay `--color-modal-overlay`) y centra una tarjeta `max-width:580px` con `border-radius:24px`, sombra `0 20px 50px -24px rgba(63,54,46,0.35)`, fondo `--color-auth-bg` (`#FBF4EC`) y borde `--color-border-cream` (`#ECE0D0`), idéntica a la referencia.
- [ ] El header muestra "Cancelar" (izq., `--color-ink-muted` `text-[15px] font-bold`), "Nueva publicación" (centro, Fredoka `text-[18px] font-semibold text-ink`) y "Publicar" (der., `--color-primary` `text-[15px] font-extrabold`) con `justify-between`. No hay botón ×.
- [ ] PARA muestra 4 pills `rounded-full` con avatar 26×26: Mateo (activa por default: borde `--color-ink`, fondo `--color-ink`, texto blanco, avatar `#A9D9E8`/`#1F7A93`), Sofía (avatar `#F4B8CC`/`#C44A7A`), Benjamín (avatar `#B9DEC4`/`#3E8B62`), "Toda la sala" (sin avatar). Las inactivas usan borde `--color-border-cream`, fondo `--color-surface`, texto `--color-ink-soft`. Single-select: clic en una la activa y desactiva las demás.
- [ ] TIPO muestra 7 pills `rounded-full` sin borde, cada una con su color propio (Comida `#9A7B1E`/blanco, Siesta `#E7DCF6`/`#7B5FC0`, Actividad `#2E89A6`/blanco, Logro `#CFEBD8`/`#3E9B6C`, Ánimo `#F9D2DE`/`#C56486`, Foto `#FBD8CC`/`#D9684A`, Anuncio `#CCD8F4`/`#4E72C8`). Single-select, default "Actividad"; la pill seleccionada lleva un anillo (`outline outline-2 outline-offset-[3px] outline-ink`) que la distingue.
- [ ] DESCRIPCIÓN es un `<textarea>` vacío al abrir, con placeholder "Contá cómo le fue hoy…", `min-height:120px`, `resize:vertical`, borde `1.5px solid --color-border-input` (`#EADFD0`), fondo blanco y `text-[15px] leading-[1.5]`. Acepta texto (estado controlado).
- [ ] FOTOS muestra 2 cajas 96×96 `rounded-[14px]`: caja 1 (fondo `--color-photo-tile-bg` `#F4ECE1`, borde `--color-border-cream`, ícono imagen en `--color-photo-tile-icon` `#CBB89F`); caja 2 (fondo `--color-photo-tile-bg`, borde `1.5px dashed --color-photo-add-border` `#DBCDBA`, ícono "+" en `--color-primary-dark` y label "Agregar" en `--color-ink-placeholder`). Ninguna abre file picker.
- [ ] Pulsar ESC cierra el modal y resetea el formulario a `{recipient:"Mateo", tipo:"Actividad", descripcion:""}`.
- [ ] Clic en el backdrop cierra el modal; clics dentro de la tarjeta NO cierran (`stopPropagation`).
- [ ] Clic en "Cancelar" cierra el modal sin efectos sobre el feed ni ninguna lista.
- [ ] Clic en "Publicar" cierra el modal sin persistir nada y sin agregar un post al feed — los 3 posts originales de `/` siguen siendo los únicos.
- [ ] Reabrir el modal tras cerrarlo muestra `recipient:"Mateo"`, `tipo:"Actividad"` y `descripcion:""` (estado reset).
- [ ] No hay validación client-side, atributos `required`, ni mensajes de error.
- [ ] `Sidebar` sigue siendo Server Component; `NewPostModal` es la única isla client importada; el resto del JSX del Sidebar (logo, nav, bloque usuario, logout) no se serializa al cliente.
- [ ] `app/_components/NewPostModal.tsx` es el único componente nuevo; `app/_components/Sidebar.tsx` solo cambia el disparador "Nueva publicación" (y añade el import); `app/page.tsx`, `app/kids/page.tsx`, `app/kids/[slug]/page.tsx`, `QuickComposer.tsx` y `app/layout.tsx` no se modifican.
- [ ] `app/globals.css` solo añade los 10 tokens nuevos (7 tipo + 3 fotos); el resto de `@theme` queda intacto.
- [ ] `npm run lint` pasa sin errores; `npx tsc --noEmit` no reporta tipos.
- [ ] Captura del modal abierto comparada contra `crear-publicacion.dc.html` coincide en estructura, colores, tipografía y espaciados (revisión Playwright en `.playwright-mcp/`).
- [ ] `/`, `/kids`, `/kids/[slug]` (modal cerrado), `/login` y `/activate-account` funcionan sin regresiones; no se navega a otra ruta al abrir/cerrar el modal.

## Decisiones tomadas y descartadas

- **Yes:** modal sobre la página actual (sin nueva ruta). El usuario lo describió como modal; mantiene la página visible detrás y evita una URL de creación.
- **No:** ruta `/publicaciones/nueva`. Innecesario; la referencia es una tarjeta modal.
- **Yes:** `NewPostModal` own trigger (botón disparador propio) y reemplazo del `<a>` del Sidebar. Análogo a SPEC 04 (AddKidModal) y SPEC 05 (LinkParentModal); evita código muerto y mantiene el disparador junto al modal.
- **No:** añadir `onClick` al `<a>` del Sidebar. Volvería interactivo un Server Component y complicaría el límite client/server.
- **Yes:** el modal abre desde todas las páginas que renderizan `Sidebar` (`/`, `/kids`, `/kids/[slug]`). El disparador vive en el Sidebar compartido; ninguna página se modifica.
- **No:** limitar el disparador solo al Feed. Diverge de dónde está el botón y deja el Sidebar de `/kids` y `/kids/[slug]` sin función.
- **Yes:** `Sidebar` permanece Server Component; `NewPostModal` es la única isla client. Mantiene el patrón Next.js de islas y no serializa más JS del necesario (mismo patrón que SPEC 04-05).
- **No:** volver `Sidebar` `'use client'` entero. Innecesario — solo el botón "Nueva publicación" es interactivo.
- **Yes:** "Publicar" estrictamente visible-no-funcional (cierra sin persistir ni agregar post al feed). Consistencia con SPEC 01-05.
- **No:** agregar el post al feed en memoria. Cambiaría el alcance y requeriría volver `/` client / levantar estado.
- **Yes:** pills PARA single-select con "Mateo" default. Fiel a la referencia (Mateo marcada); un post se dirige a un único destinatario o "Toda la sala".
- **No:** multi-select o sin default. Diverge de la referencia y no modela bien el destinatario único.
- **Yes:** pills TIPO single-select con "Actividad" default. Coincide con el texto demo de DESCRIPCIÓN y con el 2do post del feed (actividad); un post tiene un solo tipo.
- **No:** default "Comida" o sin default. "Comida" es solo la primera pill por orden; sin default el usuario puede publicar sin tipo.
- **Yes:** todas las pills TIPO muestran su color completo y la seleccionada lleva un anillo `outline-ink`. La referencia muestra las 7 coloreadas sin estado inactivo; el anillo añade la señal de selección sin desvirtuar la referencia.
- **No:** atenuar las pills TIPO no seleccionadas. La referencia no muestra atenuación; rompería la fidelidad.
- **Yes:** `<textarea>` DESCRIPCIÓN vacío al abrir. Consistencia con AddKidModal/LinkParentModal (abren vacíos); el texto de la referencia es demo.
- **No:** pre-rellenar con "Pintamos con témperas…". Acopla el modal a un mock y confunde al usuario.
- **Yes:** FOTOS estático no funcional (2 cajas decorativas, sin file picker). Consistencia con "solo diseño" (SPEC 01-05); la referencia es visual.
- **No:** `input type="file"` real. Sale del alcance visual e introduce lógica no pedida.
- **Yes:** pills PARA hardcodeadas en el modal (Mateo, Sofía, Benjamín, Toda la sala). Mock idéntico a la referencia; evita acoplar al mock `KIDS` de `app/kids/page.tsx` (que vive en otra página).
- **No:** derivar las pills del mock `KIDS`. Requiere extraer `KIDS` a un módulo compartido y cambia el alcance.
- **Yes:** cierre con "Cancelar", "Publicar", ESC y backdrop; `stopPropagation` en la tarjeta. UX estándar de modal; la referencia solo tiene "Cancelar"/"Publicar" en el header (sin ×).
- **No:** ícono × en el header. La referencia no lo tiene.
- **Yes:** sin autofocus. La primera pieza interactiva es una pill (no un input); autofocus provocaría un salto de scroll innecesario.
- **No:** autofocus en el `<textarea>`. Saltaría el modal hasta DESCRIPCIÓN; inconsistente con la jerarquía visual.
- **Yes:** sin validación client-side. Consistencia con SPEC 03-05.
- **No:** `required`, mensajes de error o `aria-invalid`. Sin backend no hay nada que validar.
- **Yes:** estado del formulario reseteado al abrir/cerrar. Comportamiento natural de un modal fresh (mismo patrón que AddKidModal/LinkParentModal).
- **No:** conservar el texto entre aperturas. Sin persistencia no hay razón.
- **Yes:** modal renderizado en árbol (sin `createPortal`) con `position:fixed inset-0 z-50`. Suficiente por z-index; consistente con SPEC 04-05.
- **No:** `createPortal` a `document.body`. Agrega dependencia al DOM y manejo extra de SSR.
- **Yes:** `max-width:580px` para la tarjeta (la referencia usa 580). Diferente del `520px` de AddKidModal y `480px` de LinkParentModal — cada modal replica su propia referencia.
- **No:** unificar el `max-width` con AddKidModal/LinkParentModal. Diverge de la fidelidad visual.
- **Yes:** 10 tokens nuevos (7 tipo + 3 fotos) + reutilización de `--color-modal-overlay` (SPEC 04), `--color-badge-actividad/logro(-bg)/anuncio(-bg)` (SPEC 01), `--color-avatar-sky/pink/green(-bg)` (SPEC 01) y tokens estructurales. Mínima extensión token-based fiel a la convención de SPEC 01-05.
- **No:** estilos inline espejo para los colores reutilizables. Rompería la convención token-based.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| `Sidebar` (Server) renderiza `NewPostModal` (Client) en 3 páginas; puede disparar warnings de hidratación | El componente client es la única isla interactiva; el modal solo existe cuando `open === true`. Verificar con `npm run build`. |
| El overlay `fixed` rendereado dentro del `<aside sticky>` puede parecer recortado | `position:fixed` se resuelve contra el viewport, no el ancestro `sticky`/`overflow` (no se recorta). Verificar en `.playwright-mcp/` desde `/`, `/kids` y `/kids/[slug]`. |
| El estado de selección de TIPO no está en la referencia (solo se ven 7 pills coloreadas) | Añadir `outline outline-2 outline-offset-[3px] outline-ink` sobre la seleccionada; validar visualmente que no desvirtúa la referencia. |
| Reutilizar `--color-badge-vincular-*` / `--color-badge-mani-*` podría sugerir acoplamiento semántico | No se reutilizan esos nombres; se añaden tokens `--color-tipo-*` propios para Ánimo y Foto, evitando confusiones. |
| 10 tokens nuevos pueden parecer excesivos frente a SPEC 04 (1) / SPEC 05 (5) | Justificado por 7 pares de color de tipo + 3 de fotos; cada token tiene un rol semántico claro y se evita inline. |
| ESC global puede colisionar con otros handlers | Registrar/desregistrar `keydown` solo cuando `open === true` (cleanup en `useEffect`). |
| `next/font/google` ya configurado en SPEC 01 | No tocar `app/layout.tsx`. |

## Qué **no** está en este spec

- Autenticación, backend, persistencia, ni agregado de posts al feed de `/` (acción "Publicar" visible-no-funcional, conforme a SPEC 01-05).
- File picker real ni subida de fotos (cajas FOTOS estático-visuales).
- Validación client-side, estados de error, atributos `required`, mensajes de error.
- Que "Compartí un momento…" (`QuickComposer`) abra el modal — sigue siendo visual no funcional.
- Editar posts, detalle de publicación, pantalla de Foto, Avisos, Mi cuenta o cualquier otra acción del Sidebar/nav.
- Responsive móvil y dark mode.
- Modificar `app/page.tsx`, `app/kids/page.tsx`, `app/kids/[slug]/page.tsx`, `app/_components/QuickComposer.tsx`, `app/layout.tsx`, o las pantallas de `/login`, `/activate-account`.

Cada uno de esos items, si se aborda, va en su propio spec.
