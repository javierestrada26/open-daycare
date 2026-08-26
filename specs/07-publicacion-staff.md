**State:** Implementado
**Depends on:** SPEC 06, DB Schema
**Date:** 2026-08-26

## Objetivo

Convertir el modal "Nueva publicación" (SPEC 06, visual) en funcional: permitir que miembros del staff creen publicaciones reales con/sin imágenes, persistirlas en Supabase, y que aparezcan inmediatamente en el feed.

## Alcance

**Incluye**

- Instalar dependencia `browser-image-compression` para conversión de imágenes a webp.
- Crear tabla `staff_rooms` para relacionar staff con salas (many-to-many).
- Crear tabla `user_preferences` para almacenar última sala usada.
- Crear bucket `post-photos` en Supabase Storage (privado, URLs firmadas).
- Implementar Server Action `createPost` para crear publicaciones.
- Implementar Server Action `uploadPostPhoto` para subir imágenes al bucket.
- Implementar Server Action `deleteOrphanedPhotos` para limpieza de imágenes huérfanas.
- Implementar Server Action `getUserPreferences` y `updateLastRoomId`.
- Modificar `NewPostModal.tsx` para:
  - Cargar niños dinámicamente desde la DB (filtrados por sala del staff).
  - Mostrar selector de sala si el staff tiene múltiples salas (default: última usada).
  - Permitir multi-select de niños (default: "Toda la sala").
  - Permitir multi-select de imágenes (máx. 5, orden de selección).
  - Subir imágenes al bucket al seleccionar (preview inmediato con URLs firmadas).
  - Convertir imágenes a webp con `browser-image-compression`.
  - Validar descripción obligatoria, tipo default (Actividad), destinatario default (Toda la sala).
  - Mostrar confirmación "¿Descartar cambios?" al cancelar con fotos subidas.
  - Mostrar toast de éxito/error.
  - Llamar a `createPost` al hacer clic en "Publicar".
  - Ejecutar `revalidatePath("/")` después de crear post.
- Modificar `app/page.tsx` (feed) para:
  - Convertir en Server Component que query posts desde DB (respetando RLS).
  - Usar `FeedPost` con datos reales.
  - Mantener Client Components solo para interacciones (likes, comentarios).
- Modificar `FeedPost.tsx` para:
  - Renderizar galería de fotos (grid 2x2 con "+X más" + lightbox).
- Agregar `mood` al enum `post_type` (Ánimo).
- Implementar función SQL `cleanup_orphaned_photos()` + pg_cron para limpieza de imágenes huérfanas.
- RLS policies para:
  - Solo staff puede crear posts.
  - Staff solo ve posts de sus salas asignadas.
  - Padres solo ven posts de sus hijos + anuncios de su sala.
  - URLs firmadas con expiración corta (1 hora).

**No incluye**

- Edición de posts existentes (spec separado).
- Eliminación de posts (spec separado).
- Reacciones/comentarios funcionales (spec separado).
- Responsive móvil y dark mode.
- Notificaciones push (spec separado).

## Modelo de datos

### Nueva tabla: `staff_rooms`

Relación many-to-many entre staff y salas.

```sql
CREATE TABLE staff_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id uuid NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(staff_id, room_id)
);

-- Índices
CREATE INDEX idx_staff_rooms_staff_id ON staff_rooms(staff_id);
CREATE INDEX idx_staff_rooms_room_id ON staff_rooms(room_id);

-- RLS
ALTER TABLE staff_rooms ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Staff can view their own room assignments"
  ON staff_rooms FOR SELECT
  TO authenticated
  USING (
    staff_id = auth.uid() 
    AND EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'staff'
    )
  );

-- Admin puede ver todas las asignaciones
CREATE POLICY "Admin can view all room assignments"
  ON staff_rooms FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );
```

### Enum: Agregar `mood` a `post_type`

```sql
ALTER TYPE post_type ADD VALUE 'mood' AFTER 'achievement';
```

### Bucket: `post-photos`

```sql
-- Crear bucket privado
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-photos', 'post-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

-- RLS policies para storage
CREATE POLICY "Staff can upload post photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'post-photos'
    AND EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role = 'staff'
    )
  );

CREATE POLICY "Staff can view their own uploaded photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND (
      -- Staff que subió la foto
      (storage.foldername(name))[1] = auth.uid()::text
      -- O admin
      OR EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role = 'admin'
      )
    )
  );

CREATE POLICY "Parents can view photos of their children's posts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND EXISTS (
      SELECT 1 FROM post_photos pp
      JOIN posts p ON pp.post_id = p.id
      JOIN post_children pc ON p.id = pc.post_id
      JOIN parent_children pc_rel ON pc.child_id = pc_rel.child_id
      WHERE pp.url = storage.foldername(name)[2]
      AND pc_rel.parent_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete their own photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

### Estructura de archivos en Storage

**Temporal (antes de publicar):**
```
post-photos/
  {staff_id}/
    temp/
      {uuid}.webp
```

**Permanente (después de publicar):**
```
post-photos/
  {staff_id}/
    {post_id}/
      {position}_{filename}.webp
```

Ejemplo: `post-photos/abc123/def456/0_photo1.webp`

Al hacer clic en "Publicar", el Server Action mueve los archivos de `temp/` a `{post_id}/` y actualiza las URLs en `post_photos`.

### Nueva tabla: `user_preferences`

Almacena preferencias de usuario (última sala usada).

```sql
CREATE TABLE user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  last_room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: usuario puede ver/editar sus propias preferencias
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

## Plan de implementación

### Fase 0: Dependencias

0. **Instalar `browser-image-compression`:**
   - `npm install browser-image-compression`
   - Verificar: `npm run build` sin errores.

### Fase 1: Schema de base de datos

1. **Crear migración `20260826200000_create_staff_rooms_table.sql`:**
   - Crear tabla `staff_rooms` con PK, FKs, unique constraint.
   - Crear índices para `staff_id` y `room_id`.
   - Habilitar RLS.
   - Crear policies para staff (ver sus propias asignaciones) y admin (ver todas).

2. **Crear migración `20260826200030_create_user_preferences_table.sql`:**
   - Crear tabla `user_preferences` con PK, FK a `users`, unique constraint en `user_id`.
   - Columna `last_room_id` nullable FK a `rooms`.
   - Habilitar RLS.
   - Crear policies para usuario ver/editar/insertar sus propias preferencias.

3. **Crear migración `20260826200100_add_mood_to_post_type.sql`:**
   - Agregar `mood` al enum `post_type`.

4. **Crear migración `20260826200200_create_storage_bucket.sql`:**
   - Insertar bucket `post-photos` en `storage.buckets`.
   - Configurar límites: 5MB, formatos jpeg/png/webp.
   - Crear policies para upload, select, delete.

5. **Crear migración `20260826200300_create_orphan_cleanup_function.sql`:**
   - Crear función SQL `cleanup_orphaned_photos()` que:
     - Busque archivos en `storage.objects` donde bucket = 'post-photos' y path contiene `/temp/`.
     - Elimine archivos con `created_at` > 24 horas (para no eliminar uploads recientes).
     - Retorne número de archivos eliminados.
   - Programar con `cron.schedule('0 3 * * *', 'SELECT cleanup_orphaned_photos()')`.

6. **Seed data:**
   - Asignar salas al staff existente (ej. Javier → Sala Soles) en `staff_rooms`.

7. **Verificar:**
   - `npx supabase db push`
   - `supabase list_tables` (verbose) para confirmar `staff_rooms` y `user_preferences`.
   - `supabase get_advisors` (security) para verificar RLS.

### Fase 2: Server Actions

6. **Crear `app/_actions/posts.ts`:**
   - `createPost(formData)`: 
     - Validar sesión (staff role).
     - Validar campos (descripcion required, tipo, child_ids).
     - Insertar en `posts` (author_id, room_id, type, body, published_at).
     - Insertar en `post_children` (post_id, child_id[]).
     - Si hay photos:
       - Mover archivos de `temp/` a `{post_id}/` en Storage.
       - Actualizar URLs en `post_photos` (post_id, url, width, height, position).
     - Actualizar `user_preferences.last_room_id` con la sala seleccionada.
     - Llamar `revalidatePath("/")`.
     - Retornar `{ success: true, postId }` o `{ success: false, error }`.
   
   - `uploadPostPhoto(file)`:
     - Validar sesión (staff role).
     - Validar archivo (tamaño ≤ 5MB, tipo jpeg/png/webp).
     - Convertir a webp usando `browser-image-compression`.
     - Generar nombre único: `{staff_id}/temp/{uuid}.webp`.
     - Subir a Storage bucket `post-photos`.
     - Retornar `{ success: true, url, path }` o `{ success: false, error }`.
   
   - `deleteOrphanedPhotos(paths)`:
     - Validar sesión (staff role).
     - Eliminar archivos de Storage en paths específicos.
     - Retornar `{ success: true }` o `{ success: false, error }`.

7. **Crear `app/_actions/rooms.ts`:**
   - `getStaffRooms()`:
     - Query `staff_rooms` + `rooms` para el staff autenticado.
     - Retornar array de `{ id, name }`.
   
   - `getRoomChildren(roomId)`:
     - Query `children` filtrados por `room_id`.
     - Solo retornar si el staff tiene acceso a esa sala.
     - Retornar array de `{ id, full_name, avatar_url }`.
   
   - `getUserPreferences()`:
     - Query `user_preferences` para el usuario autenticado.
     - Retornar `{ last_room_id }` o null si no existe.
   
   - `updateLastRoomId(roomId)`:
     - Upsert en `user_preferences` con `last_room_id`.
     - Retornar `{ success: true }` o `{ success: false, error }`.

8. **Crear `app/_actions/photos.ts`:**
   - `getSignedUrl(path)`:
     - Generar URL firmada con expiración de 1 hora.
     - Validar que el usuario tenga acceso (staff que subió o padre de niño en post).
     - Retornar `{ success: true, url }` o `{ success: false, error }`.

### Fase 3: Modificar NewPostModal

9. **Modificar `app/_components/NewPostModal.tsx`:**
   - Convertir en Client Component con `'use client'`.
   - Agregar estado para:
     - `rooms`: array de salas del staff.
     - `selectedRoomId`: sala seleccionada (default: última usada de `user_preferences` o primera).
     - `children`: array de niños de la sala seleccionada.
     - `selectedChildIds`: Set de IDs de niños seleccionados (default: todos).
     - `photos`: array de `{ id, file, previewUrl, storagePath, uploading, error }`.
     - `submitting`: boolean.
     - `error`: string | null.
     - `showDiscardConfirm`: boolean.
   
   - `useEffect` para cargar salas y preferencias al abrir modal:
     - Llamar `getStaffRooms()` y `getUserPreferences()`.
     - Si hay más de una sala, mostrar selector de sala.
     - Default: `last_room_id` de preferencias, o primera sala.
     - Cargar niños de la sala seleccionada (`getRoomChildren`).
   
   - Selector de sala (si hay múltiples):
     - Dropdown con nombre de salas.
     - onChange: actualizar `selectedRoomId`, recargar niños.
   
   - Pills PARA:
     - Reemplazar hardcodeados por niños dinámicos.
     - Multi-select: clic en niño lo agrega/quita de `selectedChildIds`.
     - Pill "Toda la sala": selecciona/deselecciona todos.
     - Default: "Toda la sala" (todos los niños).
   
   - Sección FOTOS:
     - Input file con `multiple accept="image/jpeg,image/png,image/webp"`.
     - onChange: validar tamaño (≤ 5MB), convertir a webp con `browser-image-compression`.
     - Para cada archivo:
       - Generar preview local (URL.createObjectURL).
       - Llamar `uploadPostPhoto(file)`.
       - Si success: agregar a `photos` con `storagePath` y `previewUrl`.
       - Si error: mostrar error en preview.
     - Mostrar previews en grid 96x96 (orden fijo según selección, sin drag & drop).
     - Permitir remover foto (onClick en ícono "X").
     - Máximo 5 fotos: deshabilitar input si `photos.length >= 5`.
   
   - handleSubmit:
     - Validar descripción no vacía.
     - Si `selectedChildIds.length === 0`, usar todos los niños de la sala.
     - Llamar `createPost` con:
       - `room_id`: selectedRoomId
       - `type`: form.tipo (default "Actividad")
       - `body`: form.descripcion
       - `child_ids`: selectedChildIds
       - `photo_paths`: photos.map(p => p.storagePath)
     - Si success: cerrar modal, resetear estado, mostrar toast de éxito ("Publicación creada").
     - Si error: mostrar toast de error.
   
   - Confirmación al cancelar:
     - Si `photos.length > 0` y usuario hace clic en "Cancelar" o ESC:
       - Mostrar modal de confirmación "¿Descardar cambios? Las fotos no se publicarán."
       - Si confirma: llamar `deleteOrphanedPhotos(photos.map(p => p.storagePath))`, cerrar modal.
       - Si cancela: cerrar modal de confirmación, volver al modal de publicación.
     - Si `photos.length === 0`: cerrar directamente.
   
   - Toast:
     - Componente `Toast` con mensaje, tipo (success/error), ícono, botón cerrar.
     - Auto-dismiss después de 5s.
     - Posición: bottom-right.
     - Mostrar toast de éxito al publicar.
     - Mostrar toast de error si falla creación o subida.
   
   - Estados de carga:
     - Mostrar spinner en "Publicar" mientras `submitting`.
     - Deshabilitar botones mientras `submitting`.
     - Mostrar indicador de carga en cada foto mientras `uploading`.

### Fase 4: Modificar Feed

10. **Modificar `app/page.tsx`:**
    - Convertir en Server Component (quitar `'use client'` si lo tiene).
    - Crear función `getFeedPosts()`:
      - Query posts desde DB con RLS.
      - Para staff: posts de sus salas asignadas.
      - Para padres: posts de sus hijos + anuncios de su sala.
      - Incluir: author (full_name, avatar_url), room (name), type, body, published_at, post_children (child full_name), post_photos (url, position).
      - Ordenar por `published_at DESC`.
    - Renderizar `<FeedPost />` con datos reales.
    - Pasar URLs firmadas de fotos (generar en server).

11. **Modificar `app/_components/FeedPost.tsx`:**
    - Aceptar props adicionales:
      - `photos`: array de `{ url, alt }` (múltiples fotos).
      - `postId`: para futuras acciones (editar, eliminar).
    - Renderizar galería de fotos:
      - Si 1 foto: mostrar imagen completa.
      - Si 2-4 fotos: grid 2x2 (o 1+2 para 3 fotos).
      - Si >4 fotos: mostrar primeras 4 en grid 2x2 con indicador "+X más" que abre lightbox.
    - Lightbox:
      - Modal fullscreen con carousel de fotos.
      - Navegación con flechas izquierda/derecha.
      - Cerrar con ESC o clic en backdrop.
    - Mantener Client Component para likes/comentarios (futuro spec).

### Fase 5: Job de limpieza

12. **Crear función SQL `cleanup_orphaned_photos()`:**
    - Buscar archivos en `storage.objects` donde:
      - bucket_id = 'post-photos'
      - path contiene `/temp/`
      - created_at < now() - interval '24 hours' (para no eliminar uploads recientes)
    - Eliminar archivos huérfanos usando `storage.delete_object()`.
    - Retornar número de archivos eliminados.

13. **Programar con pg_cron:**
    - `SELECT cron.schedule('cleanup-orphaned-photos', '0 3 * * *', 'SELECT cleanup_orphaned_photos()');`
    - Ejecutar diariamente a las 3 AM.
    - Verificar con `SELECT * FROM cron.job;`

### Fase 6: Verificación

14. **Probar flujo completo:**
    - Login como staff.
    - Abrir modal "Nueva publicación".
    - Seleccionar sala (si hay múltiples).
    - Seleccionar niños (multi-select).
    - Seleccionar tipo.
    - Escribir descripción.
    - Subir 1-5 fotos (ver preview).
    - Clic en "Publicar".
    - Verificar: post aparece en feed inmediatamente.
    - Verificar: fotos visibles con URLs firmadas.
    - Verificar: RLS funciona (padres solo ven posts de sus hijos).

15. **Probar casos de error:**
    - Subir imagen > 5MB → error.
    - Subir formato no permitido → error.
    - Publicar sin descripción → error.
    - Cancelar modal con fotos subidas → verificar limpieza.

16. **Verificar:**
    - `npm run lint` sin errores.
    - `npx tsc --noEmit` ok.
    - `supabase get_advisors` (security) sin warnings críticos.

## Criterios de aceptación

- [x] Staff con una sola sala: no se muestra selector de sala.
- [x] Staff con múltiples salas: se muestra selector de sala con última usada como default (desde `user_preferences`).
- [x] Pills PARA muestran niños dinámicos de la sala seleccionada (no hardcodeados).
- [x] Pills PARA permiten multi-select (clic en niño lo agrega/quita).
- [x] Pill "Toda la sala" selecciona/deselecciona todos los niños.
- [x] Default PARA: "Toda la sala" (todos los niños seleccionados).
- [x] Default TIPO: "Actividad".
- [x] Sección FOTOS permite subir hasta 5 imágenes (jpeg/png/webp).
- [x] Al seleccionar imagen, se convierte a webp con `browser-image-compression`.
- [x] Al seleccionar imagen, se sube inmediatamente al bucket en `temp/` con preview.
- [x] Preview muestra la imagen en 96x96 con opción de remover.
- [x] Si la subida falla, se muestra error en el preview.
- [x] Descripción es obligatoria (validación client + server).
- [x] Al hacer clic en "Publicar":
  - Se crea el post en DB con author_id, room_id, type, body, published_at.
  - Se insertan post_children con niños seleccionados (o todos si "Toda la sala").
  - Se mueven fotos de `temp/` a `{post_id}/` en Storage.
  - Se insertan post_photos con URLs finales.
  - Se actualiza `user_preferences.last_room_id`.
  - Se llama `revalidatePath("/")`.
- [x] Después de publicar, el modal se cierra y el feed se actualiza inmediatamente.
- [x] Se muestra toast de éxito ("Publicación creada") al publicar.
- [x] Si falla la creación, se muestra toast de error (auto-dismiss 5s).
- [x] Si el usuario cancela el modal con fotos subidas, se muestra confirmación "¿Descartar cambios?".
- [x] Si confirma descarte, se eliminan las imágenes huérfanas de Storage.
- [x] Feed muestra posts reales desde DB (no mock).
- [x] Staff ve posts de sus salas asignadas.
- [x] Padres ven posts de sus hijos + anuncios de su sala.
- [x] URLs de fotos son firmadas con expiración de 1 hora.
- [x] RLS previene que staff cree posts en salas no asignadas.
- [x] RLS previene que padres vean posts de otros niños.
- [x] Posts con 1 foto: mostrar imagen completa.
- [x] Posts con 2-4 fotos: mostrar grid 2x2 (o 1+2 para 3 fotos).
- [x] Posts con >4 fotos: mostrar primeras 4 con indicador "+X más" que abre lightbox.
- [x] Lightbox permite navegar con flechas, cerrar con ESC o clic en backdrop.
- [x] Job de limpieza pg_cron elimina archivos en `temp/` con más de 24 horas.
- [x] `npm run lint` pasa sin errores.
- [x] `npx tsc --noEmit` no reporta tipos.

## Decisiones tomadas y descartadas

- **Yes:** Tabla `staff_rooms` para relacionar staff con salas. Permite flexibilidad (un staff puede tener múltiples salas).
- **No:** Agregar `room_id` a `users`. Un staff puede tener múltiples salas, no una sola.
- **Yes:** Bucket privado con URLs firmadas. Más seguro que bucket público.
- **No:** Bucket público. Expondría fotos de niños sin autenticación.
- **Yes:** Subir imágenes al seleccionar (Opción B). Mejor UX (preview inmediato, no se pierden imágenes).
- **No:** Subir imágenes al publicar (Opción A). Si falla la subida, el usuario pierde las imágenes.
- **Yes:** Server Action para crear post. Mejor integración con Next.js, revalidatePath automático.
- **No:** Route Handler. Más boilerplate, no necesario para acción interna.
- **Yes:** Feed como Server Component con query a DB. Más simple, SEO-friendly, cacheable.
- **No:** Feed como Client Component con fetch. Más complejo, polling innecesario.
- **Yes:** Multi-select de niños. Permite publicar para múltiples niños de una vez.
- **No:** Single-select de niños. Limitante, requiere múltiples posts para misma información.
- **Yes:** Agregar `mood` al enum `post_type`. El mock original lo incluía.
- **No:** Eliminar "Ánimo" del modal. Diverge del diseño original.
- **Yes:** Job de limpieza con pg_cron + SQL function. Más simple, nativo de Supabase.
- **No:** Edge Function para limpieza. Más complejo, no necesario para tarea programada.
- **Yes:** Toast de error temporal (5s). No interrumpe el flujo, informa al usuario.
- **No:** Modal de error. Interrumpe el flujo, requiere acción del usuario.
- **Yes:** Conversión a webp con `browser-image-compression`. Robusto cross-browser, prioriza funcionalidad.
- **No:** Canvas API nativa. Puede fallar en navegadores antiguos, menos robusto.
- **Yes:** Orden fijo de fotos según selección. Simple, sin complejidad de drag & drop.
- **No:** Drag & drop para reordenar. Agrega complejidad, no es prioridad ahora.
- **Yes:** Confirmación "¿Descartar cambios?" al cancelar con fotos subidas. Previene pérdida accidental.
- **No:** Cerrar directamente y limpiar en background. Usuario puede no saber que se perdieron fotos.
- **Yes:** Toast de éxito al publicar. Confirma acción completada.
- **No:** Solo toast de error. Usuario no sabe si la acción fue exitosa.
- **Yes:** Mover archivos de `temp/` a `{post_id}/` al publicar. Estructura organizada, fácil limpieza.
- **No:** Mantener archivos en `temp/` siempre. Difícil rastrear qué archivos están en uso.
- **Yes:** Tabla `user_preferences` para última sala usada. Persiste entre dispositivos/tablets compartidas.
- **No:** localStorage para última sala. Solo funciona en un dispositivo, no funciona en tablets compartidas.
- **Yes:** Grid 2x2 con "+X más" + lightbox. Balance entre preview y simplicidad.
- **No:** Carousel horizontal. Más complejo, no muestra todas las fotos de un vistazo.
- **No:** Solo primera foto con "+X más". Usuario no ve preview de las otras fotos.
- **Yes:** URLs firmadas con expiración de 1 hora. Balance entre seguridad y UX.
- **No:** URLs firmadas con expiración de 24 horas. Ventana de exposición muy larga.
- **No:** URLs públicas. Sin control de acceso, cualquiera con la URL puede ver la foto.

## Riesgos identificados

| Riesgo | Mitigación |
| --- | --- |
| URLs firmadas expiran mientras el usuario ve el feed | Expiración de 1 hora es suficiente para sesión típica. Si expira, recargar página genera nueva URL. |
| Job de limpieza elimina fotos en uso | Job solo elimina archivos en `temp/` con más de 24 horas. Archivos publicados están en `{post_id}/`. |
| Staff sube fotos pero cancela sin publicar | Confirmación "¿Descartar cambios?" al cancelar. Si confirma, se eliminan fotos huérfanas. |
| Multi-select de niños permite seleccionar 0 niños | Default "Toda la sala" (todos seleccionados). Validación server: si `child_ids` vacío, usar todos. |
| Conversión a webp falla en navegador antiguo | `browser-image-compression` tiene fallback automático a formato original. |
| RLS policies complejas ralentizan queries | Índices en `staff_rooms(staff_id, room_id)`, `post_children(post_id, child_id)`, `parent_children(parent_id, child_id)`. |
| pg_cron job falla o no se ejecuta | Monitorear con `SELECT * FROM cron.job;`. Ejecutar manualmente si es necesario. |
| Staff con múltiples salas selecciona sala equivocada | Mostrar nombre de sala claramente en modal. `user_preferences` recuerda última usada. |
| Feed no se actualiza inmediatamente | `revalidatePath("/")` después de crear post. Si falla, recargar página manualmente. |
| Upload de imágenes > 5MB falla después de subir | Validación client-side antes de subir. Mostrar error inmediato. |
| `browser-image-compression` agrega bundle size | ~50KB gzipped. Aceptable para funcionalidad de conversión. |
| Mover archivos de `temp/` a `{post_id}/` falla al publicar | Server Action hace rollback: si falla mover, no crea post. Usuario puede reintentar. |
| `user_preferences` no existe para usuario nuevo | `getUserPreferences()` retorna null. Modal usa primera sala como default. |
| Lightbox no funciona en móviles | Usar touch events para swipe. Fallback: navegación con botones. |

## Qué **no** está en este spec

- Edición de posts existentes (spec separado).
- Eliminación de posts (spec separado).
- Reacciones/comentarios funcionales (spec separado).
- Notificaciones push (spec separado).
- Responsive móvil y dark mode.
- Scroll infinito en feed (spec separado).
- Filtros de feed por tipo, fecha, niño (spec separado).
- Búsqueda de posts (spec separado).
- Vista de detalle de post (spec separado).

Cada uno de esos items, si se aborda, va en su propio spec.
