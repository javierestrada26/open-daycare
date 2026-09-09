## Purpose

Lógica de redirects según el rol del usuario autenticado. Determina a qué panel redirigir después del login, en la raíz, y cuando un usuario intenta acceder a un panel que no le corresponde.

## ADDED Requirements

### Requirement: Post-login redirect by role
Después de un login exitoso, el sistema SHALL redirigir al usuario según su rol.

#### Scenario: Staff user logs in
- **WHEN** un usuario con role === 'staff' completa el login exitosamente
- **THEN** es redirigido a `/staff`

#### Scenario: Parent user logs in
- **WHEN** un usuario con role === 'parent' completa el login exitosamente
- **THEN** es redirigido a `/family`

#### Scenario: Admin user logs in
- **WHEN** un usuario con role === 'admin' completa el login exitosamente
- **THEN** es redirigido a `/staff`

### Requirement: Root path redirect by role
La ruta raíz `/` SHALL redirigir al usuario autenticado según su rol.

#### Scenario: Authenticated staff visits root
- **WHEN** un usuario autenticado con role === 'staff' visita `/`
- **THEN** es redirigido a `/staff`

#### Scenario: Authenticated parent visits root
- **WHEN** un usuario autenticado con role === 'parent' visita `/`
- **THEN** es redirigido a `/family`

#### Scenario: Unauthenticated user visits root
- **WHEN** un usuario no autenticado visita `/`
- **THEN** es redirigido a `/login`

### Requirement: Cross-panel access redirect
Cuando un usuario intenta acceder a un panel que no le corresponde, el sistema SHALL redirigirlo a su panel correspondiente.

#### Scenario: Parent attempts to access staff panel
- **WHEN** un usuario con role === 'parent' intenta acceder a `/staff/*`
- **THEN** es redirigido a `/family`

#### Scenario: Staff attempts to access family panel
- **WHEN** un usuario con role === 'staff' intenta acceder a `/family/*`
- **THEN** es redirigido a `/staff`
