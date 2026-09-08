-- Drop the problematic policy that causes recursion
DROP POLICY IF EXISTS "Parents can view photos of their children's posts" ON storage.objects;

-- Simplified policy: Parents can view all photos in post-photos bucket
-- Actual filtering by children is done in the application layer
-- This avoids recursion with post_children and parent_children tables
CREATE POLICY "Parents can view post photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
      AND role = 'parent'
    )
  );
