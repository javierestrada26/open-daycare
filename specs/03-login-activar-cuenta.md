**State:** Aprobado
**Depends on:** SPEC 01
**Date:** 2026-08-13

## Objetivo

Implementar las pantallas de Login (`/login`) y Activar cuenta (`/activate-account`) replicando `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html`, sin el selector de rol "Personal/Familia" en el login, con inputs reales editables, botones de envío no funcionales y datos mock estáticos.

## Alcance

**Incluye**

- Ruta `/login` (`app/login/page.tsx`, `'use client'`): layout dos columnas — panel izquierdo de marca (gradiente coral, logo sol "OpenDayCare", tagline, "Guardería Sala Soles") + formulario derecho ("Iniciar sesión", input EMAIL, input CONTRASEÑA, link "¿Olvidaste tu contraseña?" no funcional, botón "Iniciar sesión" no funcional, link "Activá tu cuenta" → `/activate-account`). **Sin** el bloque "INGRESO COMO" ni los botones Personal/Familia.
- Ruta `/activate-account` (`app/activate-account/page.tsx`, `'use client'`): tarjeta centrada — logo sol en caja gradiente, "Bienvenida a OpenDayCare", descripción, tarjeta de contexto de invitación (avatar "M" sky, "Te invitaron a seguir a / Mateo · Sala Soles"), input CÓDIGO DE INVITACIÓN (Fredoka, letter-spacing), input EMAIL, input CREAR CONTRASEÑA, checkbox de consentimiento de fotos (togglable), botón "Activar mi cuenta" no funcional, link "Iniciar sesión" → `/login`.
- Inputs reales y editables (estado controlado con `useState`); checkbox togglable. Sin validación ni estados de error.
- Extender `app/globals.css` `@theme` con tokens de auth (`--color-auth-bg`, `--color-border-input`, `--color-consent-bg/check/text`, gradiente del panel de marca) y estilos base (`input:focus{outline:none}`, color de `::placeholder`).
- Componente presentacional `app/_components/SunMark.tsx` (icono de sol) reutilizado por ambas pantallas; `Sidebar.tsx` queda intacto.
- Cross-links funcionales entre las dos pantallas vía `<Link>`.

**No incluye**

- Autenticación, sesiones, backend, hash de contraseñas, validación real del código de invitación ni persistencia.
- Selector de rol Personal/Familia (eliminado a pedido) y la lógica de redirección staff/family que dependía de él.
- Pantalla familia-feed y cualquier redirección post-login/post-activación — los botones de envío son estrictamente no funcionales.
- Flujo de "¿Olvidaste tu contraseña?" (no existe pantalla de referencia).
- Guard de auth / redirección de usuarios no autenticados desde `/`, `/kids`.
- Responsive móvil y dark mode (la plantilla es desktop fijo).
- Modificar `/` (Feed), `/kids`, `/kids/[slug]` o `app/layout.tsx`.

## Modelo de datos

Sin datos persistentes. Estado local por pantalla (`useState`) y un mock de invitación:

```ts
// app/login/page.tsx — estado del formulario
const [email, setEmail] = useState("");        // vacío (el pre-lleno dependía del rol, eliminado)
const [password, setPassword] = useState("");

// app/activate-account/page.tsx — estado del formulario
const [code, setCode] = useState("7K4P9");
const [email, setEmail] = useState("lucia.fernandez@gmail.com");
const [password, setPassword] = useState("");
const [consent, setConsent] = useState(true);

// mock de invitación (hardcodeado, idéntico a la plantilla)
const invitation = { child: "Mateo", room: "Soles", avatarLetter: "M" };
```

## Plan de implementación

1. Extender `app/globals.css`: añadir al `@theme` los tokens de auth (`--color-auth-bg: #FBF4EC`, `--color-border-input: #EADFD0`, `--color-consent-bg: #FBF1D6`, `--color-consent-check: #5FB97E`, `--color-consent-text: #8A7234`, `--color-brand-panel-1: #F6A98E`, `--color-brand-panel-3: #EC7E62`) y estilos base (`input:focus{outline:none}`, `::placeholder{color:var(--color-ink-placeholder)}`) replicando el `<style>` de las plantillas. Verificar: `npm run lint` y `npx tsc --noEmit` sin errores.
2. Crear `app/_components/SunMark.tsx`: ícono de sol (SVG `<circle>` + `<path>`) con props opcionales de tamaño/`stroke`. Sin estado. Usado por login y activar. Verificar: `npx tsc --noEmit` ok.
3. Crear `app/login/page.tsx` (`'use client'`): grid dos columnas `1.05fr 1fr` sobre fondo `--color-auth-bg`. Panel izquierdo: gradiente `linear-gradient(155deg,#F6A98E 0%,#F2937A 45%,#EC7E62 100%)`, círculos decorativos, `<SunMark/>` en caja redondeada, "OpenDayCare" (Fredoka), tagline "El día de cada niño, compartido con su familia.", pie "Guardería Sala Soles" (con el prefijo de hoja de la plantilla). Panel derecho: "Iniciar sesión" + "Ingresá para ver el día de hoy.", inputs EMAIL y CONTRASEÑA controlados, "¿Olvidaste tu contraseña?" (`<button type="button">` no funcional), botón "Iniciar sesión" (`<button type="button">` no funcional, gradiente `--color-primary-gradient-from/to`), texto "¿Te invitó la guardería?" con `<Link href="/activate-account">Activá tu cuenta</Link>`. **Sin** bloque "INGRESO COMO" ni Personal/Familia. Ver manual: `/login` renderiza, se puede escribir en los inputs, el botón no navega, "Activá tu cuenta" lleva a `/activate-account`.
4. Crear `app/activate-account/page.tsx` (`'use client'`): tarjeta centrada `max-width:440px` sobre `--color-auth-bg`. `<SunMark/>` en caja gradiente `linear-gradient(155deg,#F8C3A8,#F2937A)`, h1 "Bienvenida a OpenDayCare", descripción. Tarjeta de invitación (avatar "M" sky + "Te invitaron a seguir a / Mateo · Sala Soles"). Inputs CÓDIGO DE INVITACIÓN (`value=code`, Fredoka, `letter-spacing:3px`), EMAIL (`value=email`), CREAR CONTRASEÑA (type=password). Checkbox consent (fondo `--color-consent-bg`, check `--color-consent-check`, texto `--color-consent-text`) togglable. Botón "Activar mi cuenta" (`<button type="button">` no funcional). Texto "¿Ya tenés cuenta?" con `<Link href="/login">Iniciar sesión</Link>`. Ver manual: `/activate-account` renderiza, inputs editables, checkbox toggla, el botón no navega, "Iniciar sesión" lleva a `/login`.
5. Verificar: `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run dev` y comparación visual de `/login` y `/activate-account` contra `login.dc.html` y `activar-cuenta.dc.html` (capturas Playwright en `.playwright-mcp/`); confirmar que `/`, `/kids` y `/kids/[slug]` no sufren regresiones.

## Criterios de aceptación

- [ ] `/login` renderiza layout dos columnas: panel izquierdo con gradiente coral y panel derecho con el formulario, **sin** el bloque "INGRESO COMO" ni los botones Personal/Familia.
- [ ] El panel izquierdo muestra `<SunMark/>` en caja redondeada, "OpenDayCare" (Fredoka), tagline "El día de cada niño, compartido con su familia." y pie "Guardería Sala Soles" (con el prefijo de hoja de la plantilla).
- [ ] El formulario de login muestra "Iniciar sesión", "Ingresá para ver el día de hoy.", input EMAIL (editable) y input CONTRASEÑA (placeholder `••••••••`, editable).
- [ ] "¿Olvidaste tu contraseña?" se ve como link color `--color-primary-dark` y al clic no hace nada (no funcional).
- [ ] El botón "Iniciar sesión" tiene el gradiente coral y al clic no navega ni envía (no funcional).
- [ ] "¿Te invitó la guardería? Activá tu cuenta" contiene un `<Link>` a `/activate-account` y al clic navega.
- [ ] `/activate-account` renderiza la tarjeta centrada: `<SunMark/>` en caja gradiente, "Bienvenida a OpenDayCare" y la descripción de la plantilla.
- [ ] La tarjeta de contexto muestra avatar "M" (sky) y "Te invitaron a seguir a / Mateo · Sala Soles".
- [ ] Los inputs CÓDIGO DE INVITACIÓN (`7K4P9`, Fredoka, `letter-spacing:3px`), EMAIL (`lucia.fernandez@gmail.com`) y CREAR CONTRASEÑA se renderizan con los valores del mock y son editables.
- [ ] El checkbox de consentimiento "Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app." togla al clic (verde `--color-consent-check`).
- [ ] El botón "Activar mi cuenta" tiene el gradiente coral y al clic no navega ni envía (no funcional).
- [ ] "¿Ya tenés cuenta? Iniciar sesión" contiene un `<Link>` a `/login` y al clic navega.
- [ ] Las tipografías body=Nunito y display (títulos/logo)=Fredoka cargan vía `next/font/google` existente (sin tocar `app/layout.tsx`).
- [ ] `npm run lint` pasa sin errores y `npx tsc --noEmit` no reporta tipos.
- [ ] Capturas de `/login` y `/activate-account` comparadas contra sus `.dc.html` coinciden en estructura, colores, tipografía y espaciados, con la única diferencia intencional del selector de rol eliminado en login.
- [ ] Ningún elemento fuera de los dos cross-links ejecuta navegación o acción de backend; `/`, `/kids` y `/kids/[slug]` funcionan sin regresiones.

## Decisiones tomadas y descartadas

- **Yes:** rutas en inglés `/login` y `/activate-account` (labels UI en español). Consistencia con la convención de SPEC 02.
- **No:** rutas en español (`/iniciar-sesion`, `/activar-cuenta`). Inconsistente con el resto de paths.
- **Yes:** eliminar el selector Personal/Familia del login a pedido. Unifica el login; el email ya no se pre-llena según rol (queda vacío).
- **No:** reemplazar el selector por otra chooser ni inferir el rol. Sin backend no hay forma de decidir el rol; postergado a un spec de auth.
- **No:** pre-lleno del email en login. El prefill original dependía del rol (caro@…/lucia@…), que se eliminó; email arranca vacío.
- **Yes:** inputs reales editables (`'use client'` + `useState`). Más cercano a un form real que un mock estático.
- **No:** validación client-side o estados de error. Alcance "puramente visual", sin backend.
- **Yes:** ambos botones de envío no funcionales (sin navegación). Auth y familia-feed fuera de alcance; coherente con el patrón "visible no funcional" de SPEC 01-02.
- **Yes:** cross-links `/login ↔ /activate-account` funcionales vía `<Link>`. Son la columna navegable del feature.
- **No:** navegación post-login/post-activación (a `/` o familia-feed). Queda para el spec de auth cuando exista backend.
- **Yes:** "¿Olvidaste tu contraseña?" visible no funcional. No existe pantalla de referencia.
- **Yes:** rutas standalone, `/` (Feed) sin cambios. Evita regresar SPEC 01; no hay guard de auth.
- **Yes:** extender `@theme` con tokens de auth. Consistencia token-based con SPEC 01-02.
- **No:** estilos inline espejo para los nuevos colores. Rompería la convención token-based.
- **Yes:** extraer `SunMark.tsx` para el logo de sol, usado por las dos pantallas de auth. Reduce duplicación.
- **No:** refactorizar `Sidebar.tsx` para usar `SunMark`. Evita regresar SPEC 01-02; la copia inline del Sidebar se puede consolidar después.
- **No:** responsive móvil y dark mode. Coherente con specs previos (plantilla desktop fija).
- **No:** toggle de visibilidad de contraseña. No está en la referencia.
- **No:** fondo `--color-app-bg` para las pantallas de auth. La plantilla usa `#FBF4EC`; se añade `--color-auth-bg` dedicado para no alterar el Feed.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El fondo de auth `#FBF4EC` difiere del Feed `#F6ECDF` (app-bg) | Token dedicado `--color-auth-bg` solo en auth; no se toca `--color-app-bg`. |
| Inputs `'use client'` controlados pueden introducir trampas de hidratación | Estado simple (un `useState` por campo), sin lógica de validación; verificar con `npm run build`. |
| Quitar el selector de rol diverge del mock de referencia | Diferencia intencional documentada en alcance y criterios; se permite en la comparación visual. |
| Duplicación del SVG del sol entre `SunMark` y `Sidebar` | Aceptada y registrada; consolidación futura sin tocar SPEC 01-02 ahora. |
| `next/font/google` ya configurado en SPEC 01 | No modificar `app/layout.tsx`. |

## Qué **no** está en este spec

- Autenticación, sesiones, backend, hash de contraseñas, validación real del código de invitación y cualquier persistencia.
- Selector de rol Personal/Familia y la redirección staff/family que dependía de él (eliminado a pedido; sin reemplazo).
- Pantalla familia-feed y la navegación post-login/post-activación (los botones de envío son no funcionales).
- Flujo de "¿Olvidaste tu contraseña?" (no hay pantalla de referencia).
- Guard de auth / redirección de usuarios no autenticados desde `/`, `/kids`.
- Responsive móvil y dark mode.
- Modificar el Feed (`/`), Niños, perfiles o `app/layout.tsx`.

Cada uno de esos items, si se aborda, va en su propio spec.