## Context

El sistema actual tiene una única interfaz en `app/` con rutas `/`, `/kids`, `/kids/[slug]` orientadas al staff. El middleware valida solo autenticación, no rol. La tabla `public.users` ya tiene la columna `role` con valores `staff`, `parent`, `admin`.

Ver proposal.md para la motivación completa.

## Goals / Non-Goals

**Goals:**
- Separar la experiencia del staff y la familia en rutas independientes (`/staff/*` y `/family/*`)
- Validar el rol del usuario en cada panel antes de renderizar
- Redirigir según rol post-login y en la raíz `/`
- Reutilizar componentes compartidos (FeedPost, KidCard, etc.)
- Mantener la lógica de queries existente (feed por salas para staff, feed por hijos para parent)

**Non-Goals:**
- Modificar schema de base de datos o RLS policies
- Implementar rutas adicionales de `/family/*` más allá del feed (ej. "Mis hijos")
- Cambiar la lógica de autenticación de Supabase
- Implementar responsive móvil o dark mode

## Decisions

### 1. Route groups con layouts como "proxy" de validación

**Decisión:** Usar layouts de Next.js en `app/staff/layout.tsx` y `app/family/layout.tsx` para validar el rol antes de renderizar las páginas hijas.

**Rationale:** 
- Next.js 16 no tiene middleware, los layouts son el punto natural de validación
- Un layout se ejecuta antes de cualquier página hija, garantizando protección
- Permite código compartido entre todas las páginas del grupo
- Alternativa considerada: Route Handlers como proxy — descartada porque añade complejidad innecesaria para validación de rol

**Alternativa descartada:** Validación en cada página individual — descartada porque duplica lógica y es propenso a errores.

### 2. Estructura de directorios con componentes específicos por grupo

**Decisión:** 
- `app/staff/_components/` para componentes específicos del staff (AddKidModal, KidsBrowser, LinkParentModal, NewPostModal, QuickComposer)
- `app/family/_components/` para componentes específicos de la familia (FamilySidebar)
- `app/_components/` para componentes compartidos (FeedPost, KidCard, SunMark, etc.)
- `app/_actions/` y `app/_lib/` permanecen arriba como compartidos

**Rationale:**
- Separación clara de responsabilidades
- Facilita identificar qué componentes pertenecen a cada panel
- Los componentes compartidos (FeedPost, KidCard) se usan en ambos paneles
- Alternativa considerada: Mover todo a cada grupo — descartada porque FeedPost y KidCard se usan en ambos

### 3. Redirect en app/page.tsx según rol

**Decisión:** `app/page.tsx` será un Server Component que lee el rol del usuario y redirige a `/staff` o `/family`.

**Rationale:**
- La raíz `/` no tiene contenido propio, solo redirige
- Server Component puede leer cookies y hacer redirect sin cliente
- Alternativa considerada: Redirect en middleware — descartada porque no hay middleware

### 4. Auth action lee el rol para decidir redirect

**Decisión:** `app/_actions/auth.ts` modificará `signIn` para leer el rol del usuario después del login y redirigir según el rol.

**Rationale:**
- El redirect post-login necesita conocer el rol
- Se lee de `public.users` que ya tiene la columna `role`
- Alternativa considerada: Guardar el rol en la sesión de Supabase — descartada porque requiere cambios en el flujo de auth

### 5. Admin treated as staff

**Decisión:** Los usuarios con role === 'admin' pueden acceder a `/staff/*` igual que los staff.

**Rationale:**
- El admin es un super-staff, necesita acceso al panel administrativo
- Simplifica la lógica: `role === 'staff' || role === 'admin'`
- No se crea un panel separado para admin

## Risks / Trade-offs

**[Risk] Doble query de rol (layout + página)** → Cada layout hace una query para validar el rol, y las páginas pueden necesitar el rol nuevamente. Mitigación: las páginas pueden recibir el rol como prop desde el layout, o cachear el resultado en un context.

**[Risk] Redirect chains (ej. `/` → `/staff` → `/login` si no hay sesión)** → Posibles redirects en cadena. Mitigación: el layout verifica autenticación antes que rol, evitando redirects innecesarios.

**[Risk] Componentes compartidos con imports largos** → Los componentes en `app/staff/` que importan de `app/_components/` tienen paths más largos. Mitigación: usar el alias `@/` para imports absolutos.

**[Trade-off] No hay middleware** → Sin middleware, la validación ocurre en cada layout. Esto es aceptable porque los layouts son Server Components y la query es rápida.

**[Trade-off] Root page hace una query extra** → `app/page.tsx` hace una query para decidir el redirect. Esto añade latencia mínima (una query a `public.users`).
