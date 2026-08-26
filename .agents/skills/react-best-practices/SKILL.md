---
name: react-best-practices
description: "Apply React best practices to specified files or auto-detect modified .tsx/.jsx files. Uses Context7 to verify current documentation. Analyzes hooks, TypeScript patterns, and performance optimizations. Supports --dry-run mode for review."
argument-hint: "[file/folder path] [--dry-run]"
allowed-tools: Read, Edit, Glob, Grep, Bash, context7_resolve-library-id, context7_query-docs
---

# React Best Practices Skill

Este skill aplica las mejores prácticas de React a archivos específicos o detecta automáticamente archivos modificados. Usa Context7 para verificar que las recomendaciones estén actualizadas con la documentación oficial más reciente.

## Cuándo usar este skill

- Cuando quieras aplicar mejores prácticas de React a tu código
- Para revisar y mejorar componentes existentes
- Para detectar problemas comunes de hooks, TypeScript o performance
- Para modernizar código React siguiendo los patrones actuales

## Modo de operación

### Detección de archivos (modo híbrido)

El skill determina qué archivos analizar siguiendo esta lógica:

1. **Si `$ARGUMENTS` contiene una ruta específica** (archivo o carpeta):
   - Analizar solo esa ruta
   - Ejemplo: `/react-best-practices src/components/Button.tsx`
   - Ejemplo: `/react-best-practices src/features/auth`

2. **Si `$ARGUMENTS` está vacío**:
   - Buscar automáticamente archivos modificados en este orden:
     - Archivos staged en git: `git diff --cached --name-only -- "*.tsx" "*.jsx"`
     - Si no hay staged, archivos modificados: `git diff --name-only -- "*.tsx" "*.jsx"`
     - Si no hay cambios en git, todos los archivos `.tsx` y `.jsx` del directorio actual

3. **Si `$ARGUMENTS` contiene `--dry-run`**:
   - Solo listar sugerencias sin modificar archivos
   - Mostrar qué cambios se harían y por qué
   - Útil para revisión antes de aplicar cambios

### Ejemplos de uso

```
/react-best-practices                              # Analiza archivos modificados automáticamente
/react-best-practices src/components/Button.tsx    # Analiza solo ese archivo
/react-best-practices src/features/auth            # Analiza todos los .tsx/.jsx en esa carpeta
/react-best-practices --dry-run                    # Solo muestra sugerencias, no modifica
/react-best-practices src/components --dry-run     # Dry-run en carpeta específica
```

## Flujo de análisis

### Paso 1: Determinar archivos a analizar

Ejecutar la lógica de detección descrita arriba para obtener la lista de archivos.

### Paso 2: Leer cada archivo

Para cada archivo identificado:
- Leer el contenido completo
- Identificar imports, componentes, hooks, y patrones usados
- Tomar nota de problemas potenciales

### Paso 3: Consultar Context7 para mejores prácticas actualizadas

**IMPORTANTE**: Antes de sugerir cambios, verificar con Context7 que las recomendaciones estén actualizadas.

Realizar estas consultas a Context7:

1. **Para hooks**:
   - `context7_resolve-library-id` con libraryName="React", query="hooks best practices useEffect dependencies"
   - `context7_query-docs` con el libraryId obtenido, query="useEffect dependencies useCallback useMemo best practices"

2. **Para TypeScript**:
   - `context7_query-docs` con libraryId de React, query="TypeScript best practices props typing generics"

3. **Para performance**:
   - `context7_query-docs` con libraryId de React, query="performance optimization memo lazy Suspense"

### Paso 4: Analizar y aplicar cambios (por prioridad)

Analizar cada archivo siguiendo este orden de prioridad:

#### Prioridad 1: Hooks

**Verificar y corregir:**

- **useEffect**:
  - Dependencias completas y correctas
  - Evitar dependencias que cambian en cada render (objetos/arrays inline)
  - Cleanup functions cuando sea necesario
  - No usar useEffect para derivar estado (usar useMemo en su lugar)

- **useMemo/useCallback**:
  - Usar cuando el valor/callback se pasa como prop a componentes memoizados
  - Usar para cálculos costosos
  - No memoizar todo indiscriminadamente (solo donde aporte valor)

- **Custom hooks**:
  - Extraer lógica reutilizable en custom hooks
  - Nombrar con prefijo `use`
  - Retornar valores estables (no crear nuevos objetos/arrays en cada render)

**Ejemplo de corrección:**

```tsx
// ❌ Antes
useEffect(() => {
  fetchData(userId);
}, []); // Falta userId en dependencias

// ✅ Después
useEffect(() => {
  fetchData(userId);
}, [userId]);
```

#### Prioridad 2: TypeScript patterns

**Verificar y corregir:**

- **Props tipadas**:
  - Definir interfaces/types explícitos para props
  - Evitar `any` completamente
  - Usar `unknown` cuando el tipo es realmente desconocido

- **Interfaces vs Types**:
  - Preferir `interface` para props de componentes (extensible)
  - Usar `type` para uniones, intersecciones y tipos complejos

- **Genéricos**:
  - Usar en componentes reutilizables que trabajan con diferentes tipos
  - Nombrar genéricos de forma descriptiva (no solo `T`)

- **Event handlers**:
  - Tipar correctamente los eventos (React.MouseEvent, React.ChangeEvent, etc.)

**Ejemplo de corrección:**

```tsx
// ❌ Antes
function Button({ onClick, children }: any) {
  return <button onClick={onClick}>{children}</button>;
}

// ✅ Después
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}
```

#### Prioridad 3: Performance

**Verificar y corregir:**

- **Memoización selectiva**:
  - `React.memo` para componentes que reciben las mismas props frecuentemente
  - `useMemo` para cálculos costosos
  - `useCallback` para funciones pasadas como props a componentes memoizados

- **Lazy loading**:
  - `React.lazy` para componentes grandes que no se necesitan inmediatamente
  - `Suspense` con fallback apropiado

- **Evitar renders costosos**:
  - No crear objetos/arrays inline en props (moverlos fuera o memoizarlos)
  - No definir funciones inline en render (usar useCallback)
  - Usar `key` estable en listas (no el índice)

**Ejemplo de corrección:**

```tsx
// ❌ Antes
function UserList({ users }) {
  return (
    <ul>
      {users.map((user, index) => (
        <UserCard key={index} user={user} onClick={() => handleUserClick(user.id)} />
      ))}
    </ul>
  );
}

// ✅ Después
function UserList({ users }) {
  const handleUserClick = useCallback((userId: string) => {
    // lógica
  }, []);

  return (
    <ul>
      {users.map((user) => (
        <UserCard
          key={user.id}
          user={user}
          onClick={() => handleUserClick(user.id)}
        />
      ))}
    </ul>
  );
}
```

### Paso 5: Aplicar cambios o mostrar sugerencias

#### Modo normal (sin --dry-run)

Para cada problema identificado:
1. Aplicar la corrección usando `Edit`
2. Registrar el cambio para el resumen final

#### Modo --dry-run

Para cada problema identificado:
1. **NO** modificar el archivo
2. Registrar la sugerencia con:
   - Archivo y línea
   - Problema detectado
   - Cambio sugerido
   - Razón del cambio

### Paso 6: Mostrar resumen final

Generar un resumen estructurado:

```markdown
## Análisis de React Best Practices completado

### Archivos analizados: X

### Cambios aplicados: (o "Sugerencias identificadas:" en modo --dry-run)

#### `path/to/file1.tsx`
- **[Hook]** Corregidas dependencias de useEffect (línea 15)
  - Problema: Faltaba `userId` en el array de dependencias
  - Solución: Agregada dependencia `userId`
  
- **[TypeScript]** Reemplazado `any` con tipo explícito (línea 8)
  - Problema: Props tipadas como `any`
  - Solución: Creada interface `ButtonProps` con tipos explícitos

- **[Performance]** Extraído callback con useCallback (línea 23)
  - Problema: Función inline causaba re-render de componente hijo memoizado
  - Solución: Envuelta en `useCallback` con dependencias correctas

#### `path/to/file2.tsx`
- **[Hook]** Eliminado useEffect innecesario (línea 45)
  - Problema: useEffect calculaba valor derivado del estado
  - Solución: Reemplazado con `useMemo`

### Resumen de cambios:
- X problemas de hooks corregidos
- Y problemas de TypeScript mejorados
- Z optimizaciones de performance aplicadas
- Total: N cambios en M archivos
```

## Reglas importantes

1. **Siempre usar Context7**: Antes de sugerir cualquier cambio, verificar con Context7 que la recomendación esté alineada con la documentación actual de React.

2. **No romper funcionalidad**: Los cambios deben mantener el comportamiento existente. Si un cambio podría alterar el comportamiento, documentarlo explícitamente.

3. **Respetar el estilo del proyecto**: Mantener la convención de nombres, estructura de carpetas y estilo de código existente.

4. **Priorizar legibilidad**: No aplicar optimizaciones de performance si hacen el código significativamente más difícil de entender.

5. **Memoización consciente**: No memoizar todo por defecto. Solo aplicar `React.memo`, `useMemo`, `useCallback` donde haya un beneficio claro (componentes que reciben las mismas props frecuentemente, cálculos costosos, funciones pasadas a componentes memoizados).

6. **TypeScript estricto**: Evitar `any` completamente. Si no se puede determinar el tipo, usar `unknown` y hacer type narrowing.

7. **Hooks limpios**: Seguir las reglas de los hooks:
   - Solo llamar hooks en el nivel superior
   - Solo llamar hooks desde componentes de React o custom hooks
   - Dependencias completas y correctas

8. **Explicar los cambios**: Cada cambio debe incluir una explicación clara de qué se cambió y por qué.

## Ejemplos de flujo completo

### Ejemplo 1: Análisis automático de archivos modificados

```
Usuario: /react-best-practices

Skill:
1. Ejecuta: git diff --cached --name-only -- "*.tsx" "*.jsx"
2. Si no hay staged: git diff --name-only -- "*.tsx" "*.jsx"
3. Encuentra: src/components/UserProfile.tsx, src/features/auth/LoginForm.tsx
4. Lee ambos archivos
5. Consulta Context7 para verificar mejores prácticas
6. Analiza y aplica cambios
7. Muestra resumen con todos los cambios realizados
```

### Ejemplo 2: Análisis de archivo específico en modo dry-run

```
Usuario: /react-best-practices src/components/Dashboard.tsx --dry-run

Skill:
1. Detecta ruta específica: src/components/Dashboard.tsx
2. Detecta flag --dry-run
3. Lee el archivo
4. Consulta Context7
5. Analiza problemas
6. NO modifica el archivo
7. Muestra solo las sugerencias con explicaciones detalladas
```

## Referencias

- Documentación oficial de React: https://react.dev
- React TypeScript Cheatsheet: https://react-typescript-cheatsheet.netlify.app
- Rules of Hooks: https://react.dev/warnings/invalid-hook-call-warning
- Performance Optimization: https://react.dev/reference/react/memo
