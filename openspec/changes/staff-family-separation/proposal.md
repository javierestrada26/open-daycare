## Why

El sistema actual tiene una única interfaz orientada al staff. Los padres (role === 'parent') acceden al mismo panel que el personal, viendo funcionalidades que no les corresponden (gestión de niños, crear publicaciones, etc.). Esto genera confusión y expone acciones administrativas a usuarios que solo deberían ver información sobre sus hijos. Es necesario separar las experiencias en dos paneles independientes con rutas y permisos diferenciados.

## What Changes

- **BREAKING**: Reestructuración completa de rutas. Las rutas actuales (`/`, `/kids`, `/kids/[slug]`) se mueven a `/staff/*`
- **NEW**: Grupo de rutas `/staff/*` con layout que valida role === 'staff' (o 'admin'). Si un parent intenta acceder, redirect a `/family`
- **NEW**: Grupo de rutas `/family/*` con layout que valida role === 'parent'. Si un staff intenta acceder, redirect a `/staff`
- **NEW**: Redirect inteligente post-login según rol: staff → `/staff`, parent → `/family`
- **NEW**: Redirect en raíz `/` según rol del usuario autenticado
- **NEW**: Sidebars diferenciados por rol (StaffSidebar y FamilySidebar)
- **NEW**: Componentes específicos de cada grupo se mueven dentro de su respectivo grupo
- **MODIFIED**: Lógica de autenticación para incluir validación de rol

## Capabilities

### New Capabilities

- `staff-routes`: Rutas del panel del staff (`/staff`, `/staff/kids`, `/staff/kids/[slug]`) con layout que valida role. Incluye StaffSidebar. Componentes específicos se mueven a `app/staff/_components/`
- `family-routes`: Rutas del panel de la familia (`/family`) con layout que valida role. Incluye FamilySidebar. Por ahora solo el feed
- `role-based-redirects`: Redirects según rol. Post-login, raíz `/`, y acceso no autorizado entre paneles

### Modified Capabilities

- `09-auth-y-proteccion-de-rutas`: La protección cambia de "autenticado/no" a "autenticado + rol correcto". Redirect post-login depende del rol

## Impact

**Estructura:**
- Se crean `app/staff/` y `app/family/` con sus respectivos layouts y rutas
- Se mueven componentes específicos a `app/staff/_components/` y `app/family/_components/`
- `_actions/`, `_lib/` y componentes compartidos (FeedPost, KidCard, etc.) permanecen en `app/`
- `app/page.tsx` se convierte en un redirect según rol

**Rutas:**
- `/` → Redirect según rol
- `/staff` → Feed del staff (antes `/`)
- `/staff/kids` → Lista de niños (antes `/kids`)
- `/staff/kids/[slug]` → Perfil (antes `/kids/[slug]`)
- `/family` → Feed de la familia (nuevo)

**Auth:**
- `auth.ts` lee el rol para decidir redirect post-login
- Layouts validan rol antes de renderizar

**Base de datos:**
- Sin cambios en schema, RLS o migraciones
