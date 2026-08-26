INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-photos', 'post-photos', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);

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
      (storage.foldername(name))[1] = auth.uid()::text
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
