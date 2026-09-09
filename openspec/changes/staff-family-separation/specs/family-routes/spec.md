## Purpose

Panel de la familia con rutas protegidas por rol. Solo usuarios con role === 'parent' pueden acceder. Incluye feed de la familia con publicaciones filtradas por los hijos del usuario.

## ADDED Requirements

### Requirement: Family layout validates role
El layout de `/family` SHALL validar que el usuario autenticado tenga role === 'parent' antes de renderizar las páginas hijas.

#### Scenario: Parent user accesses /family
- **WHEN** un usuario con role === 'parent' visita `/family`
- **THEN** el layout renderiza las páginas hijas normalmente

#### Scenario: Staff user attempts to access /family
- **WHEN** un usuario con role === 'staff' visita `/family` o cualquier ruta hija
- **THEN** el layout redirige a `/staff`

#### Scenario: Unauthenticated user attempts to access /family
- **WHEN** un usuario no autenticado visita `/family` o cualquier ruta hija
- **THEN** el layout redirige a `/login`

### Requirement: Family feed page at /family
La ruta `/family` SHALL renderizar el feed de la familia con las publicaciones filtradas por los hijos del usuario.

#### Scenario: Parent views their family feed
- **WHEN** un usuario con role === 'parent' visita `/family`
- **THEN** ve las publicaciones etiquetadas a sus hijos más los anuncios generales

#### Scenario: Parent with no children views feed
- **WHEN** un usuario con role === 'parent' sin hijos vinculados visita `/family`
- **THEN** ve solo los anuncios generales

### Requirement: Family sidebar with navigation
El FamilySidebar SHALL mostrar navegación específica de la familia: Feed, y en el futuro "Mis hijos".

#### Scenario: Family sidebar shows correct navigation
- **WHEN** un usuario con role === 'parent' está en cualquier ruta de `/family/*`
- **THEN** el sidebar muestra: Feed (y en el futuro "Mis hijos")

### Requirement: Family-specific components location
Los componentes específicos de la familia SHALL ubicarse en `app/family/_components/`.

#### Scenario: Family components are in correct location
- **WHEN** se importan componentes específicos de la familia
- **THEN** se importan desde `app/family/_components/`
