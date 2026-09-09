## MODIFIED Requirements

### Requirement: Protección de rutas con validación de rol
El sistema SHALL proteger las rutas validando no solo que el usuario esté autenticado, sino también que tenga el rol correcto para acceder al panel correspondiente.

#### Scenario: Usuario autenticado con rol correcto accede a su panel
- **WHEN** un usuario autenticado con role === 'staff' visita `/staff/*`
- **THEN** el sistema renderiza el contenido normalmente

#### Scenario: Usuario autenticado con rol incorrecto intenta acceder a panel ajeno
- **WHEN** un usuario con role === 'parent' intenta acceder a `/staff/*`
- **THEN** el sistema redirige a `/family`

#### Scenario: Usuario no autenticado intenta acceder a ruta protegida
- **WHEN** un usuario no autenticado visita `/staff/*` o `/family/*`
- **THEN** el sistema redirige a `/login`

#### Scenario: Usuario autenticado visita ruta pública
- **WHEN** un usuario autenticado visita `/login` o `/activate-account`
- **THEN** el sistema redirige a su panel correspondiente según rol (`/staff` o `/family`)

### Requirement: Redirect post-login según rol
Después de un login exitoso, el sistema SHALL redirigir al usuario a su panel correspondiente según su rol.

#### Scenario: Login exitoso de usuario staff
- **WHEN** un usuario con role === 'staff' completa el login exitosamente
- **THEN** es redirigido a `/staff`

#### Scenario: Login exitoso de usuario parent
- **WHEN** un usuario con role === 'parent' completa el login exitosamente
- **THEN** es redirigido a `/family`

### Requirement: Rutas públicas sin cambios
Las rutas `/login` y `/activate-account` SHALL permanecer como rutas públicas sin validación de rol.

#### Scenario: Usuario no autenticado accede a login
- **WHEN** un usuario no autenticado visita `/login`
- **THEN** el sistema renderiza la página de login normalmente

#### Scenario: Usuario no autenticado accede a activar cuenta
- **WHEN** un usuario no autenticado visita `/activate-account`
- **THEN** el sistema renderiza la página de activación normalmente
