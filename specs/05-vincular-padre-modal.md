**State:** Aprobado
**Depends on:** SPEC 02
**Date:** 2026-08-17

## Objetivo

Implementar el modal "Vincular padre" sobre la pantalla `/kids/[slug]` que se abre al pulsar "Vincular otro padre", replicando `references/pantallas/vincular-padre.dc.html`, con inputs reales editables, pills de parentesco single-select, código de invitación mock estático y botón "Enviar invitación" visible-no-funcional — sin autenticación, backend ni persistencia.

## Alcance

**Incluye**

- Crear `app/_components/LinkParentModal.tsx` (`'use client'`): botón disparador (avatar circular punteado con "+" + label "Vincular otro padre" en `--color-primary-dark`) + overlay modal centrado con backdrop (clic en backdrop o ESC cierran) replicando `vincular-padre.dc.html`:
  - Header: a la izq. título "Vincular padre" (Fredoka `text-[18px] font-semibold text-ink`) + subtítulo `a {kidName}` (`text-[13px] text-ink-faint`); a la der. botón × (caja `34×34 rounded-[10px]` fondo `--color-divider` (`#F0E6D8`), ícono × en `--color-ink-muted` (`#94887B`)) que cierra.
  - Banner info (azul): contenedor `--color-info-banner-bg` (`#E3ECFB`), `rounded-[14px]`, `p-[13px_16px]`, ícono círculo-info en `--color-badge-anuncio` (`#4E72C8`), texto "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {kidFirstName}." en `--color-info-banner-text` (`#3F5694`).
  - Campo NOMBRE DEL PADRE/MADRE: `<input>` placeholder "Ej. Diego Fernández".
  - Campo EMAIL: `<input type="email">` placeholder "correo@ejemplo.com".
  - PARENTESCO: tres `<button type="button">` pill `rounded-full` — Mamá (default seleccionada: borde `--color-pill-active-border` (`#9FB8EC`), fondo `--color-badge-anuncio-bg` (`#CCD8F4`), texto `--color-badge-anuncio` (`#4E72C8`)), Papá y Tutor/a (inactivos: borde `--color-border-cream`, fondo `--color-surface`, texto `--color-ink-soft`). Single-select: clic en una la activa y desactiva las demás.
  - Caja CÓDIGO DE INVITACIÓN: contenedor `--color-consent-bg` (`#FBF1D6`), borde `1.5px dashed --color-consent-border` (`#E6D08A`), `rounded-[16px]`, `p-[18px]` centrado. Label "CÓDIGO DE INVITACIÓN" en `--color-consent-label` (`#A88526`), código "7K4P9" (Fredoka `text-[34px] tracking-[7px]` en `--color-consent-text` (`#8A7234`)), texto "Vence en 7 días" en `--color-consent-label`. Estático, no editable.
  - Botón "Enviar invitación": `type="button"`, gradiente `--color-primary-gradient-from/to`, ícono paper-plane blanco, `box-shadow: 0 10px 22px -8px rgba(238,129,100,.7)`. Cierra el modal.
- Inputs controlados con `useState` (vacíos al abrir; reset al cerrar). Autofocus en NOMBRE al abrir. Pills con estado `relation: "Mamá" | "Papá" | "Tutor/a"` (default `"Mamá"`).
- Cierre: botón ×, clic en backdrop, tecla ESC. Clics dentro de la tarjeta no propagan (`stopPropagation`). Modal rendereado con `position:fixed inset-0 z-50` sin `createPortal`.
- Modificar `app/kids/[slug]/page.tsx`: reemplazar `<LinkedParent addNew label="Vincular otro padre" />` (línea 158) por `<LinkParentModal kidName={kid.name} />`; añadir import. El resto del JSX queda intacto (mock `MATEO`, sidebar, allergy box, info rows, botón "Resumen del día", padres Lucía/Diego).
- Modificar `app/_components/LinkedParent.tsx`: remover la variante `addNew` (rama `if ("addNew" in props)` líneas 24-45) y el tipo `AddNewData` (líneas 11-14) — verificado que el único consumo está en `app/kids/[slug]/page.tsx:158`, que se reemplaza. `LinkedParent` vuelve a ser puramente presentacional para padres existentes.
- La página `/kids/[slug]` permanece Server Component (async) — el modal es la única isla client.
- Extender `app/globals.css` `@theme` con 5 tokens nuevos (`--color-info-banner-bg`, `--color-info-banner-text`, `--color-pill-active-border`, `--color-consent-label`, `--color-consent-border`); reutilizar `--color-modal-overlay` (SPEC 04), `--color-consent-bg`/`--color-consent-text` (SPEC 03), `--color-badge-anuncio`/`--color-badge-anuncio-bg`, `--color-divider`, `--color-auth-bg`, `--color-border-cream`, `--color-border-input`, `--color-ink*`, `--color-primary*`, `--color-surface`.

**No incluye**

- Autenticación, backend, envío real de email, persistencia, ni modificación de la lista `parents` del perfil (Lucía y Diego siguen siendo los únicos).
- Agregar el padre recién "invitado" a la columna PADRES VINCULADOS (la acción "Enviar invitación" es estrictamente visible-no-funcional, igual que SPEC 01-04).
- Validación client-side, estados de error, atributos `required` o mensajes de error.
- Generación dinámica del código de invitación (es el mock hardcodeado "7K4P9").
- Pantallas de Editar niño, Resumen del día, Familia-cuenta, Avisos, Mi cuenta o cualquier acción disparada desde la tarjeta de niño o el perfil.
- Responsive móvil y dark mode.
- Modificar `app/page.tsx`, `app/kids/page.tsx`, `app/_components/Sidebar.tsx`, `app/layout.tsx`, ni las pantallas de `/login`, `/activate-account`.

## Modelo de datos

Sin datos persistentes. Estado local del modal (`useState`):

```ts
// app/_components/LinkParentModal.tsx
type Relation = "Mamá" | "Papá" | "Tutor/a";

const [open, setOpen] = useState(false);
const [form, setForm] = useState({
  name: "",
  email: "",
  relation: "Mamá" as Relation,   // default seleccionada
});

// código de invitación mock (hardcodeado, idéntico a SPEC 03)
const INVITE_CODE = "7K4P9";
```

Props del componente: `{ kidName: string }` (ej. "Mateo Fernández"). La lista `MATEO.parents` en `app/kids/[slug]/page.tsx` no se toca. `form` se reinicia a `{name:"", email:"", relation:"Mamá"}` cada vez que `open` cambia.

## Plan de implementación

1. **Extender `app/globals.css` `@theme`:** añadir 5 tokens — `--color-info-banner-bg: #E3ECFB`, `--color-info-banner-text: #3F5694`, `--color-pill-active-border: #9FB8EC`, `--color-consent-label: #A88526`, `--color-consent-border: #E6D08A`. Reutilizar `--color-badge-anuncio`/`--color-badge-anuncio-bg` (ícono banner + pill activa bg/texto), `--color-consent-bg`/`--color-consent-text` (caja código), `--color-divider` (fondo del ×), `--color-modal-overlay` (backdrop). Confirmar sintaxis Tailwind v4 con Context7. Verificar: `npm run lint` y `npx tsc --noEmit` sin errores.
2. **Crear `app/_components/LinkParentModal.tsx` (`'use client'`):** exportación por defecto con props `{ kidName: string }`. Renderea el disparador + (cuando `open === true`) el overlay:
   - Disparador: `<button type="button" onClick={() => setOpen(true)}>` replicando el markup actual del `addNew` de `LinkedParent` (avatar `w-10 h-10 rounded-full border-[1.5px] border-dashed border-[#D8CBBA]` con ícono "+", label "Vincular otro padre" en `text-primary-dark font-extrabold text-[14.5px]`).
   - Overlay: `<div className="fixed inset-0 z-50 flex items-start justify-center p-[40px_24px]" style={{background:"var(--color-modal-overlay)"}} onClick={close}>`.
   - Tarjeta: `<div onClick={(e)=>e.stopPropagation()} className="w-full max-w-[480px] bg-auth-bg border border-border-cream rounded-[24px] shadow-[0_20px_50px_-24px_rgba(63,54,46,0.35)] overflow-hidden">` — `max-width:480px` (la referencia usa 480, no 520 como AddKidModal).
   - Header: `flex items-center justify-between px-[26px] py-5 border-b border-border-cream` — izq. `<div>` con "Vincular padre" + `a {kidName}`; der. `<button type="button" onClick={close}>` caja `w-[34px] h-[34px] rounded-[10px] bg-divider` con `<svg>` × en `text-ink-muted`.
   - Cuerpo `px-[26px] py-[22px]`:
     - Banner info: `<div className="flex gap-[11px] bg-info-banner-bg rounded-[14px] p-[13px_16px] mb-5">` con `<svg>` círculo-info en `text-badge-anuncio` + texto en `text-info-banner-text text-[13.5px] leading-[1.45]`: "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de {firstName}." (`firstName = kidName.split(" ")[0]`).
     - Label "NOMBRE DEL PADRE/MADRE" + `<input autoFocus>` con `form.name`, placeholder "Ej. Diego Fernández".
     - Label "EMAIL" + `<input type="email">` con `form.email`, placeholder "correo@ejemplo.com".
     - Label "PARENTESCO" + `<div className="flex gap-[9px] mb-5">` con tres `<button type="button">` pill `flex-1 py-[11px] rounded-full border-[1.5px] font-extrabold text-[14px]`. La activa usa `bg-badge-anuncio-bg border-pill-active-border text-badge-anuncio`; las inactivas `bg-surface border-border-cream text-ink-soft`. `onClick` setea `form.relation`.
     - Caja código: `<div className="bg-consent-bg border-[1.5px] border-dashed border-consent-border rounded-[16px] p-[18px] text-center mb-5">` con label "CÓDIGO DE INVITACIÓN" (`text-[12px] font-extrabold tracking-[0.7px] text-consent-label`), `<div className="font-display font-semibold text-[34px] tracking-[7px] text-consent-text">7K4P9</div>`, y "Vence en 7 días" (`text-[13px] text-consent-label`).
     - Botón "Enviar invitación": `<button type="button" onClick={close} className="flex items-center justify-center gap-[9px] w-full p-[14px] rounded-[14px] text-white font-extrabold text-[15.5px]" style={{background:"linear-gradient(180deg,var(--color-primary-gradient-from),var(--color-primary-gradient-to))",boxShadow:"0 10px 22px -8px rgba(238,129,100,.7)"}}>` + `<svg>` paper-plane blanco + "Enviar invitación".
   - Inputs controlados: `value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})}` y análogo para `email`. Sin `<form>` real — todos los botones `type="button"`.
   - `close()`: `setOpen(false)` + `setForm({name:"",email:"",relation:"Mamá"})`.
   - ESC: `useEffect` que registra/desregistra `keydown` solo cuando `open === true` (mismo patrón que AddKidModal).
   - Verificar: `npx tsc --noEmit` ok.
3. **Modificar `app/_components/LinkedParent.tsx`:** remover la rama `if ("addNew" in props)` (líneas 24-45) y el tipo `AddNewData` (líneas 11-14). Cambiar `LinkedParentProps` a solo `ParentData`. `LinkedParent` vuelve a ser presentacional para padres existentes. Verificar: `npx tsc --noEmit` ok (la página ya no usa `addNew` tras el paso 4).
4. **Modificar `app/kids/[slug]/page.tsx`** (sin añadir `'use client'`): reemplazar `<LinkedParent addNew label="Vincular otro padre" />` (línea 158) por `<LinkParentModal kidName={kid.name} />`. Añadir import: `import { LinkParentModal } from "../../_components/LinkParentModal";`. El resto del JSX intocado. Ver manual: cargar `/kids/mateo-fernandez`, clic en "Vincular otro padre" abre el modal sobre la página sin cambiar la URL.
5. **Verificar:** `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run dev` y comparación visual lado a lado entre el modal abierto y `references/pantallas/vincular-padre.dc.html` (capturas Playwright en `.playwright-mcp/`). Comprobar además que:
   - × cierra el modal y resetea el formulario.
   - ESC cierra; clic en backdrop cierra; clics dentro de la tarjeta no.
   - "Enviar invitación" cierra sin cambiar la URL ni agregar items a PADRES VINCULADOS — Lucía y Diego siguen siendo los únicos.
   - Los inputs aceptan texto; las pills de parentesco son single-select con Mamá default; al reabrir, todos los campos están vacíos y Mamá vuelve a ser la activa.
   - `/`, `/kids`, `/login`, `/activate-account` funcionan sin regresiones.

## Criterios de aceptación

- [ ] Clic en "Vincular otro padre" de `/kids/[slug]` abre un modal sobre la página en la misma URL; la URL no cambia.
- [ ] El disparador mantiene el aspecto del `addNew` original: avatar `w-10 h-10 rounded-full` con borde punteado `#D8CBBA` e ícono "+", label "Vincular otro padre" en `--color-primary-dark font-extrabold text-[14.5px]`.
- [ ] El modal oscurece el fondo (overlay `--color-modal-overlay`) y centra una tarjeta `max-width:480px` con `border-radius:24px`, sombra `0 20px 50px -24px rgba(63,54,46,0.35)`, fondo `--color-auth-bg` y borde `--color-border-cream`, idéntica a la referencia.
- [ ] El header muestra a la izq. "Vincular padre" (Fredoka `text-[18px]`) + "a Mateo Fernández" (`text-[13px] text-ink-faint`); a la der. botón × (caja `34×34 rounded-[10px] bg-divider`, ícono `text-ink-muted`) que cierra el modal.
- [ ] El banner info muestra fondo `--color-info-banner-bg` (`#E3ECFB`), ícono en `--color-badge-anuncio` (`#4E72C8`) y texto "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo." en `--color-info-banner-text` (`#3F5694`).
- [ ] NOMBRE DEL PADRE/MADRE es un `<input>` con placeholder "Ej. Diego Fernández" y recibe `autoFocus` al abrirse.
- [ ] EMAIL es un `<input type="email">` con placeholder "correo@ejemplo.com".
- [ ] PARENTESCO muestra tres pills `rounded-full`: Mamá (activa por default: fondo `#CCD8F4`, borde `#9FB8EC`, texto `#4E72C8`), Papá y Tutor/a (inactivas: fondo `--color-surface`, borde `--color-border-cream`, texto `--color-ink-soft`). Single-select: clic en una la activa y desactiva las demás.
- [ ] La caja CÓDIGO DE INVITACIÓN muestra fondo `--color-consent-bg` (`#FBF1D6`), borde `1.5px dashed #E6D08A`, label "CÓDIGO DE INVITACIÓN" en `--color-consent-label` (`#A88526`), código "7K4P9" (Fredoka `text-[34px] tracking-[7px]` en `--color-consent-text`) y "Vence en 7 días" en `--color-consent-label`. Estático, no editable.
- [ ] El botón "Enviar invitación" tiene el gradiente coral, ícono paper-plane blanco, sombra `0 10px 22px -8px rgba(238,129,100,.7)` y al clic cierra el modal sin persistir ni agregar el padre a PADRES VINCULADOS.
- [ ] Pulsar ESC cierra el modal y resetea el formulario a `{name:"", email:"", relation:"Mamá"}`.
- [ ] Clic en el backdrop cierra el modal; clics dentro de la tarjeta NO cierran (`stopPropagation`).
- [ ] Clic en el botón × cierra el modal sin efectos sobre la lista PADRES VINCULADOS.
- [ ] Reabrir el modal tras cerrarlo muestra los campos vacíos y Mamá como pill activa (estado reset).
- [ ] No hay validación client-side, atributos `required`, ni mensajes de error.
- [ ] `/kids/[slug]` sigue siendo Server Component (async); `LinkParentModal` es la única isla client importada; el resto del JSX de la página no se serializa al cliente.
- [ ] `app/_components/LinkedParent.tsx` ya no contiene la variante `addNew` ni el tipo `AddNewData` — vuelve a ser presentacional para padres existentes.
- [ ] `app/_components/LinkParentModal.tsx` es el único componente nuevo; `app/kids/[slug]/page.tsx` solo cambia el disparador (y añade el import); `LinkedParent.tsx` solo pierde la rama `addNew`.
- [ ] `app/globals.css` solo añade los 5 tokens del banner info + pill border + consent label/border; el resto de `@theme` queda intacto.
- [ ] `npm run lint` pasa sin errores; `npx tsc --noEmit` no reporta tipos.
- [ ] Captura del modal abierto comparada contra `vincular-padre.dc.html` coincide en estructura, colores, tipografía y espaciados (revisión Playwright en `.playwright-mcp/`).
- [ ] `/`, `/kids`, `/kids/[slug]` (modal cerrado), `/login` y `/activate-account` funcionan sin regresiones; no se navega a otra ruta al abrir/cerrar el modal.

## Decisiones tomadas y descartadas

- **Yes:** modal sobre `/kids/[slug]` (sin nueva ruta). El usuario lo describió como modal; mantiene el perfil visible detrás y evita una URL de vínculo.
- **No:** ruta `/kids/[slug]/vincular`. Innecesario; la referencia es una tarjeta modal.
- **Yes:** `LinkParentModal` own trigger (botón disparador propio) y remoción de la variante `addNew` de `LinkedParent`. Análogo a SPEC 04 (AddKidModal ownaba el trigger); evita código muerto (verificado: el único consumo era `app/kids/[slug]/page.tsx:158`) y mantiene `LinkedParent` puramente presentacional.
- **No:** añadir `onClick` a `LinkedParent.addNew`. Volvería interactivo un componente presentacional rendereado por un Server Component y complicaría el límite client/server.
- **Yes:** "Enviar invitación" estrictamente visible-no-funcional (cierra sin persistir ni modificar `parents`). Consistencia con SPEC 01-04.
- **No:** agregar el padre a PADRES VINCULADOS en memoria. Cambiaría el alcance y requeriría levantar estado / volver `/kids/[slug]` client.
- **Yes:** pills PARENTESCO single-select con "Mamá" default. Fiel a la referencia (Mamá marcada); un padre tiene una sola relación.
- **No:** multi-select o sin default. Diverge de la referencia y no modela bien el parentesco.
- **Yes:** código "7K4P9" hardcodeado + "Vence en 7 días". Consistente con SPEC 03 (mockea el mismo código) y con el alcance "solo diseño".
- **No:** generar el código aleatoriamente al abrir. Sale del alcance visual y agrega lógica no pedida.
- **Yes:** cierre con ×, ESC y backdrop; `stopPropagation` en la tarjeta. UX estándar de modal; el × replica la referencia (que no tiene Cancelar/Guardar en el header, solo ×).
- **No:** ícono × además de un botón Cancelar. La referencia solo tiene ×.
- **Yes:** sin validación client-side. Consistencia con SPEC 03-04.
- **No:** `required`, mensajes de error o `aria-invalid`. Sin backend no hay nada que validar.
- **Yes:** estado del formulario reseteado al abrir/cerrar. Comportamiento natural de un modal fresh (mismo patrón que AddKidModal).
- **No:** conservar el texto entre aperturas. Sin persistencia no hay razón.
- **Yes:** `/kids/[slug]` permanece Server Component; `LinkParentModal` es la única isla client. Mantiene el patrón Next.js de islas y no serializa más JS del necesario.
- **No:** volver `/kids/[slug]` `'use client'` entero. Innecesario — el mock `MATEO` y los `<LinkedParent/>`/`<InfoRow/>`/`<AllergyBox/>` son presentacionales.
- **Yes:** modal renderizado en árbol (sin `createPortal`) con `position:fixed inset-0 z-50`. Suficiente por z-index; consistente con SPEC 04.
- **No:** `createPortal` a `document.body`. Agrega dependencia al DOM y manejo extra de SSR.
- **Yes:** reutilizar `--color-modal-overlay` (SPEC 04), `--color-consent-bg`/`text` (SPEC 03), `--color-badge-anuncio`/`-bg` (ícono banner + pill activa), `--color-divider` (fondo del ×) y los tokens `--color-auth-bg`/`--color-border-cream`/`--color-ink*`/`--color-primary*` existentes; añadir solo 5 tokens nuevos (`info-banner-bg/text`, `pill-active-border`, `consent-label/border`). Mínima extensión token-based.
- **No:** estilos inline espejo para los colores reutilizables. Rompería la convención token-based de SPEC 01-04.
- **Yes:** subtítulo dinámico `a {kidName}` vía prop (siempre "Mateo Fernández" hoy). Future-proof si SPEC 02 algún día tiene perfiles por niño; hoy equivalente a hardcodear.
- **No:** hardcodear "a Mateo Fernández" en el componente. Acopla el componente a un mock y dificulta reutilización.
- **Yes:** `max-width:480px` para la tarjeta (la referencia usa 480). Diferente del `520px` de AddKidModal — cada modal replica su propia referencia.
- **No:** unificar el `max-width` con AddKidModal. Diverge de la fidelidad visual.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| Mezclar Server (`/kids/[slug]`) con Client (`LinkParentModal`) puede disparar warnings de hidratación | El componente client es el único interactivo; el modal solo existe cuando `open === true`. Verificar con `npm run build`. |
| Remover la variante `addNew` de `LinkedParent` puede romper otros usos | Verificado con `Select-String`: el único consumo está en `app/kids/[slug]/page.tsx:158`, que se reemplaza en el paso 4. |
| Las pills PARENTESCO requieren estado single-select con clases condicionales | `form.relation` como source of truth; derivar la clase activa por comparación; validar visualmente contra la referencia. |
| `autoFocus` puede saltar antes de que el modal sea visible (flash de scroll) | `<input autoFocus>` solo se monta cuando `open === true`; sin animación de entrada (mismo patrón que AddKidModal). |
| Sin `createPortal`, el overlay `fixed` dentro de un `<main>` con `overflow-y-auto` puede renderizarse recortado | `position:fixed` se resuelve contra el viewport, no el ancestro `overflow` (no se recorta). Verificar en `.playwright-mcp/`. |
| El banner info y las pills introducen paleta azul nueva | Reutilizar `--color-badge-anuncio`/`-bg` (mismo `#4E72C8`/`#CCD8F4`) para ícono y pill activa; añadir solo `--color-info-banner-bg`/`text` y `--color-pill-active-border`; confirmar sintaxis Tailwind v4 con Context7 antes del paso 1. |
| `next/font/google` ya configurado en SPEC 01 | No tocar `app/layout.tsx`. |

## Qué **no** está en este spec

- Autenticación, backend, envío real de email, persistencia, ni modificación de la lista `parents` del perfil.
- Agregar el padre recién "invitado" a PADRES VINCULADOS (acción "Enviar invitación" visible-no-funcional, conforme a SPEC 01-04).
- Validación client-side, estados de error, atributos `required`, mensajes de error.
- Generación dinámica del código de invitación (mock hardcodeado "7K4P9").
- Pantallas de Editar niño, Resumen del día, Familia-cuenta, Avisos, Mi cuenta o cualquier acción disparada desde la tarjeta de niño o el perfil.
- Responsive móvil y dark mode.
- Modificar `/` (Feed), `/kids`, `app/_components/Sidebar.tsx`, `app/layout.tsx`, o las pantallas de `/login`, `/activate-account`.

Cada uno de esos items, si se aborda, va en su propio spec.
