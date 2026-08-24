**State:** Implementado
**Depends on:** SPEC 04, SPEC 11
**Date:** 2026-08-24

## Objetivo

Reemplazar el input de texto libre de fecha de nacimiento del modal "Agregar niño" por selectores de día, mes y año que solo permitan elegir una fecha real.

## Alcance

**Incluye**

- Nuevo componente cliente `app/_components/BirthDatePicker.tsx` con tres `<select>`: día, mes, año.
- Meses con nombres en español (Enero…Diciembre).
- Años dinámicos: año actual hasta 10 años atrás.
- Días dinámicos según mes/año (28/29/30/31), con clamp al último día válido.
- Integración en `app/_components/AddKidModal.tsx`: reemplaza el input de texto y compone `dd/mm/aaaa` para `createKid`.
- Error inline si se intenta guardar con la fecha incompleta.
- Ajuste del mensaje de error en `app/_actions/kids.ts` (sin mencionar el formato dd/mm/aaaa).

**No incluye**

- Bloqueo de fechas futuras en la UI (el servidor ya las rechaza).
- Edición de la fecha de un niño existente (no hay flujo de edición).
- Cambios en la base de datos o en la firma de `createKid`.
- Date picker tipo calendario.

## Modelo de datos

No introduce estructuras nuevas ni cambios de schema. `children.birth_date (date)` ya existe (SPEC 10). Estado local del picker:

```ts
type BirthDateValue = {
  day: number | null;   // 1..31
  month: number | null; // 1..12
  year: number | null;  // añoActual-10 .. añoActual
};
```

Convención: mes en 1–12 (no 0–11 como `Date`). Hacia el formulario se emite `dd/mm/aaaa` o `null` si está incompleto.

## Plan de implementación

1. **Crear `app/_components/BirthDatePicker.tsx`** (`'use client'`), controlado por props `{ value: BirthDateValue, onChange }`. Helpers internos: `MONTHS` (nombres ES), `daysInMonth(year, month)` (`new Date(year, month, 0).getDate()`) y rango de años calculado al renderizar (año actual … año actual − 10). Clamp: si al cambiar mes/año el día supera el máximo, se ajusta al último día válido. Selectores con placeholder ("Día", "Mes", "Año") y estilos del `<select>` de sala existente (mismas clases, chevron SVG). Ver manual: render del componente aislado con febrero 2024 → 29 días; febrero 2025 → 28 días. `npx tsc --noEmit` ok.
2. **Integrar en `AddKidModal.tsx`:** estado `birthDate` inicial todo `null`; reemplazar el `<input type="text">` por `<BirthDatePicker>`. Layout: la fecha pasa a fila propia con los 3 selectores en columnas; la sala a su propia fila (mismas clases y espaciados existentes). Ver manual: abrir modal → 3 selectores vacíos con placeholders. `npx tsc --noEmit` ok.
3. **Cablear `handleSave`:** si la fecha está incompleta (algún campo `null`), `setError("Completá la fecha de nacimiento.")` y no llamar a la action; si está completa, componer `dd/mm/aaaa` (con `padStart(2, '0')`) y llamar `createKid` como hoy. Ver manual: guardar sin fecha → error inline, sin request; guardar con fecha válida → crea el niño y cierra el modal. `npx tsc --noEmit` ok.
4. **Ajustar mensaje en `app/_actions/kids.ts`:** cambiar `"Revisá el nombre y la fecha (dd/mm/aaaa)."` por `"Revisá el nombre y la fecha de nacimiento."` (la validación regex `^\d{2}/\d{2}/\d{4}$` + parseo + rechazo de futuras se mantiene intacta como red de seguridad). Ver manual: forzar un futuro seleccionable (ej. diciembre del año en curso) → error del servidor tras submit.
5. **Verificar:** `npm run lint` sin errores; `npx tsc --noEmit` ok; `npm run build` sin errores. E2E manual: login → `/kids` → "Agregar niño" → elegir 31/Ene/2020 → Guardar → tarjeta aparece; elegir 31 → cambiar a Feb → día clamp a 29 (2020 bisiesto); guardar sin completar → error inline. `/`, `/login`, `/activate-account` sin regresiones. Cero DDL.

## Criterios de aceptación

- [x] El modal muestra tres selectores (día, mes, año) en lugar del input de texto.
- [x] Los meses se muestran con nombres en español (Enero…Diciembre).
- [x] El selector de año ofrece desde el año actual hasta 10 años atrás; no hay años futuros.
- [x] Al elegir febrero, el selector de día ofrece 28 días (29 en bisiesto, ej. 2024).
- [x] Con día 31 elegido, al cambiar a un mes de 30 días el día se ajusta a 30 (clamp); al cambiar a febrero de año no bisiesto se ajusta a 28.
- [x] Guardar con la fecha incompleta muestra error inline (`"Completá la fecha de nacimiento."`) y no llama al servidor.
- [x] Guardar con fecha válida crea el niño y cierra el modal; la lista se refresca (`revalidatePath`).
- [x] El servidor sigue rechazando fechas futuras con `"Revisá el nombre y la fecha de nacimiento."` (red de seguridad).
- [x] `npm run lint` y `npx tsc --noEmit` pasan sin errores; `npm run build` sin errores.
- [x] Cero DDL (no se tocan tablas, columnas, RLS, triggers ni migraciones).

## Decisiones tomadas y descartadas

- **Yes:** tres `<select>` nativos. Accesibles, sin dependencias nuevas, consistentes con el `<select>` de sala de SPEC 04.
- **No:** date picker tipo calendario (ej. react-day-picker). Más pesado, rompe la estética actual y suma una dependencia.
- **Yes:** meses con nombres en español. Más legible para el personal de la guardería; confirmado en fase de preguntas.
- **Yes:** años dinámicos (actual −10). Sin mantenimiento; cubre edades de 0 a 10 años.
- **No:** rango de años fijo. Requeriría tocar el código con el tiempo.
- **Yes:** días dinámicos con clamp al último día válido. Evita fechas imposibles (31/02) sin borrar la selección del usuario.
- **No:** mostrar siempre 31 días y validar en el servidor. Peor UX: deja elegir fechas que luego se rechazan.
- **No:** bloquear días/meses futuros en la UI. Se delega a la validación existente del servidor (cambio mínimo); el año máximo es el actual.
- **Yes:** mantener el contrato `birthDate: string` (`dd/mm/aaaa`) de `createKid`. La action no cambia su lógica de validación; el cliente compone el string desde los 3 selectores.
- **No:** cambiar la firma de `createKid` a `{ day, month, year }`. Tocaría el contrato sin beneficio.
- **Yes:** validar fecha completa en el cliente con error inline antes de llamar a la action. Consistente con el patrón del modal (SPEC 04/11) y evita un submit inútil.
- **Yes:** ajustar el mensaje del servidor a `"Revisá el nombre y la fecha de nacimiento."`. Con selectores, la mención a `dd/mm/aaaa` ya no aplica.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| El clamp silencioso confunde (elige 31 y termina en 28/30) | El día ajustado queda visible en el selector antes de guardar; el usuario ve el valor final |
| Desfase de zona horaria al componer la fecha | Se compone `dd/mm/aaaa` por componentes; la action ya convierte a ISO sin parsear strings con `new Date()` |
| Roto si SPEC 04/11 cambian el layout del modal o la firma de `createKid` | Dependencias declaradas arriba; el picker se integra en la fila existente sin alterar el resto |

## Qué **no** está en este spec

- Bloqueo de fechas futuras en la UI.
- Edición de datos de un niño existente.
- Cambios de schema o de la firma de `createKid`.
- Date picker tipo calendario.
