## 1. Estructura de directorios

- [x] 1.1 Crear directorios `app/staff/`, `app/staff/_components/`, `app/staff/kids/`, `app/staff/kids/[slug]/`, `app/family/`, `app/family/_components/`. Verificar que todos los directorios existen con `Get-ChildItem app/staff, app/family`

## 2. Mover componentes específicos del staff

- [x] 2.1 Mover `app/_components/AddKidModal.tsx` a `app/staff/_components/AddKidModal.tsx`. Verificar que el archivo existe en la nueva ubicación y que los imports internos usan `@/` correctamente
- [x] 2.2 Mover `app/_components/KidsBrowser.tsx` a `app/staff/_components/KidsBrowser.tsx`. Verificar que el archivo existe en la nueva ubicación y que los imports internos usan `@/` correctamente
- [x] 2.3 Mover `app/_components/LinkParentModal.tsx` a `app/staff/_components/LinkParentModal.tsx`. Verificar que el archivo existe en la nueva ubicación y que los imports internos usan `@/` correctamente
- [x] 2.4 Mover `app/_components/NewPostModal.tsx` a `app/staff/_components/NewPostModal.tsx`. Verificar que el archivo existe en la nueva ubicación y que los imports internos usan `@/` correctamente
- [x] 2.5 Mover `app/_components/QuickComposer.tsx` a `app/staff/_components/QuickComposer.tsx`. Verificar que el archivo existe en la nueva ubicación y que los imports internos usan `@/` correctamente
- [x] 2.6 Actualizar imports en `app/staff/_components/KidsBrowser.tsx` para importar `AddKidModal` desde `./AddKidModal` (ruta relativa dentro de staff/_components)
- [x] 2.7 Actualizar imports en `app/staff/_components/KidsBrowser.tsx` para importar `LinkParentModal` desde `./LinkParentModal` (ruta relativa dentro de staff/_components)

## 3. Crear StaffSidebar

- [x] 3.1 Crear `app/staff/_components/StaffSidebar.tsx` basado en el `Sidebar.tsx` actual. Debe incluir: logo "OpenDayCare · Sala Soles", botón "Nueva publicación" (importando NewPostModal desde `./NewPostModal`), navegación (Feed → `/staff`, Niños → `/staff/kids`, Avisos → `#`, Mi cuenta → `#`), bloque de usuario con nombre real del usuario autenticado, y botón de logout. Verificar que exporta `StaffSidebar` como Server Component

## 4. Crear páginas de /staff

- [x] 4.1 Crear `app/staff/page.tsx` moviendo la lógica del feed actual desde `app/page.tsx`. Debe importar `StaffSidebar` desde `./_components/StaffSidebar`, `QuickComposer` desde `./_components/QuickComposer`, y `FeedPost` desde `@/app/_components/FeedPost`. La query del feed permanece igual (filtrada por salas del staff). Verificar que `npm run dev` muestra el feed en `/staff` para un usuario staff
- [x] 4.2 Crear `app/staff/kids/page.tsx` moviendo la lógica desde `app/kids/page.tsx`. Debe importar `StaffSidebar` desde `../_components/StaffSidebar` y `AddKidModal` desde `../_components/AddKidModal`. Verificar que `/staff/kids` muestra la lista de niños
- [x] 4.3 Crear `app/staff/kids/[slug]/page.tsx` moviendo la lógica desde `app/kids/[slug]/page.tsx`. Debe importar `StaffSidebar` desde `../../_components/StaffSidebar`. Verificar que `/staff/kids/mateo-fernandez` muestra el perfil del niño

## 5. Crear layout de /staff con validación de rol

- [x] 5.1 Crear `app/staff/layout.tsx` como Server Component que: (1) lee el usuario con `supabase.auth.getUser()`, (2) si no hay usuario redirige a `/login`, (3) lee el rol de `public.users`, (4) si role === 'parent' redirige a `/family`, (5) si role !== 'staff' y role !== 'admin' redirige a `/family`, (6) renderiza `<StaffSidebar />` + children. Verificar que un parent que visita `/staff` es redirigido a `/family`

## 6. Crear FamilySidebar

- [x] 6.1 Crear `app/family/_components/FamilySidebar.tsx` como Server Component. Debe incluir: logo "OpenDayCare · Sala Soles", navegación (Feed → `/family`, y en el futuro "Mis hijos" → `#`), bloque de usuario con nombre real del usuario autenticado, y botón de logout. NO incluye botón "Nueva publicación". Verificar que exporta `FamilySidebar` como Server Component

## 7. Crear página de /family

- [x] 7.1 Crear `app/family/page.tsx` con la lógica del feed de la familia. Debe importar `FamilySidebar` desde `./_components/FamilySidebar` y `FeedPost` desde `@/app/_components/FeedPost`. La query del feed filtra por hijos del usuario (usando `parent_children` + `post_children`) más anuncios generales. Reutilizar la lógica de query que ya existe en `app/page.tsx` para el caso role === 'parent'. Verificar que `npm run dev` muestra el feed en `/family` para un usuario parent

## 8. Crear layout de /family con validación de rol

- [x] 8.1 Crear `app/family/layout.tsx` como Server Component que: (1) lee el usuario con `supabase.auth.getUser()`, (2) si no hay usuario redirige a `/login`, (3) lee el rol de `public.users`, (4) si role === 'staff' o role === 'admin' redirige a `/staff`, (5) si role !== 'parent' redirige a `/staff`, (6) renderiza `<FamilySidebar />` + children. Verificar que un staff que visita `/family` es redirigido a `/staff`

## 9. Modificar app/page.tsx para redirect según rol

- [x] 9.1 Modificar `app/page.tsx` para que sea un Server Component que: (1) lee el usuario con `supabase.auth.getUser()`, (2) si no hay usuario redirige a `/login`, (3) lee el rol de `public.users`, (4) si role === 'parent' redirige a `/family`, (5) si role === 'staff' o role === 'admin' redirige a `/staff`. Eliminar toda la lógica del feed (se movió a `/staff/page.tsx`). Verificar que `/` redirige a `/staff` para un usuario staff y a `/family` para un usuario parent

## 10. Modificar auth.ts para redirect post-login según rol

- [x] 10.1 Modificar `app/_actions/auth.ts` para que `signIn`: (1) después de `signInWithPassword` exitoso, lea el rol del usuario de `public.users`, (2) si role === 'parent' redirige a `/family`, (3) si role === 'staff' o role === 'admin' redirige a `/staff`. Verificar que login con usuario staff redirige a `/staff` y login con usuario parent redirige a `/family`

## 11. Eliminar middleware.ts

- [x] 11.1 Eliminar `middleware.ts` de la raíz del proyecto. Verificar que el archivo ya no existe con `Test-Path middleware.ts`
- [x] 11.2 Eliminar las rutas antiguas `app/kids/page.tsx` y `app/kids/[slug]/page.tsx` (ya se movieron a `/staff/kids/`). Verificar que los archivos ya no existen

## 12. Limpieza de imports y referencias

- [x] 12.1 Verificar que ningún archivo importa desde rutas antiguas (`app/_components/AddKidModal`, `app/_components/KidsBrowser`, `app/_components/LinkParentModal`, `app/_components/NewPostModal`, `app/_components/QuickComposer`). Buscar con grep y corregir imports rotos
- [x] 12.2 Verificar que `app/_components/Sidebar.tsx` ya no se usa (se reemplazó por StaffSidebar y FamilySidebar). Si no se usa, eliminarlo. Verificar con grep que ningún archivo lo importa

## 13. Verificación final

- [x] 13.1 Ejecutar `npm run lint` y verificar que no hay errores
- [x] 13.2 Ejecutar `npx tsc --noEmit` y verificar que no hay errores de tipos
- [x] 13.3 Ejecutar `npm run build` y verificar que el build completa sin errores
- [X] 13.4 Verificación manual E2E: (1) login como staff → redirige a `/staff`, (2) login como parent → redirige a `/family`, (3) parent visita `/staff` → redirige a `/family`, (4) staff visita `/family` → redirige a `/staff`, (5) `/` redirige según rol, (6) logout funciona en ambos paneles
