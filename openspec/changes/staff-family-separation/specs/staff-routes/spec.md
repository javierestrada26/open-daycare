## Purpose

Panel del staff con rutas protegidas por rol. Solo usuarios con role === 'staff' o 'admin' pueden acceder. Incluye feed del staff, gestión de niños y navegación específica.

## ADDED Requirements

### Requirement: Staff layout validates role
El layout de `/staff` SHALL validar que el usuario autenticado tenga role === 'staff' o role === 'admin' antes de renderizar las páginas hijas.

#### Scenario: Staff user accesses /staff
- **WHEN** un usuario con role === 'staff' visita `/staff`
- **THEN** el layout renderiza las páginas hijas normalmente

#### Scenario: Admin user accesses /staff
- **WHEN** un usuario con role === 'admin' visita `/staff`
- **THEN** el layout renderiza las páginas hijas normalmente

#### Scenario: Parent user attempts to access /staff
- **WHEN** un usuario con role === 'parent' visita `/staff` o cualquier ruta hija
- **THEN** el layout redirige a `/family`

#### Scenario: Unauthenticated user attempts to access /staff
- **WHEN** un usuario no autenticado visita `/staff` o cualquier ruta hija
- **THEN** el layout redirige a `/login`

### Requirement: Staff feed page at /staff
La ruta `/staff` SHALL renderizar el feed del staff con las publicaciones filtradas por las salas asignadas al usuario.

#### Scenario: Staff views their feed
- **WHEN** un usuario con role === 'staff' visita `/staff`
- **THEN** ve las publicaciones de las salas a las que está asignado

### Requirement: Staff kids list at /staff/kids
La ruta `/staff/kids` SHALL renderizar la lista de niños de las salas asignadas al usuario.

#### Scenario: Staff views kids list
- **WHEN** un usuario con role === 'staff' visita `/staff/kids`
- **THEN** ve la lista de niños de sus salas asignadas

### Requirement: Staff kid profile at /staff/kids/[slug]
La ruta `/staff/kids/[slug]` SHALL renderizar el perfil detallado de un niño específico.

#### Scenario: Staff views kid profile
- **WHEN** un usuario con role === 'staff' visita `/staff/kids/mateo-fernandez`
- **THEN** ve el perfil detallado del niño

### Requirement: Staff sidebar with navigation
El StaffSidebar SHALL mostrar navegación específica del staff: Feed, Niños, Avisos, Mi cuenta, y botón "Nueva publicación".

#### Scenario: Staff sidebar shows correct navigation
- **WHEN** un usuario con role === 'staff' está en cualquier ruta de `/staff/*`
- **THEN** el sidebar muestra: Feed, Niños, Avisos, Mi cuenta, y botón "Nueva publicación"

### Requirement: Staff-specific components location
Los componentes específicos del staff (AddKidModal, KidsBrowser, LinkParentModal, NewPostModal, QuickComposer) SHALL ubicarse en `app/staff/_components/`.

#### Scenario: Staff components are in correct location
- **WHEN** se importan componentes específicos del staff
- **THEN** se importan desde `app/staff/_components/`
