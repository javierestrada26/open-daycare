-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS post_children_select_staff ON post_children;
DROP POLICY IF EXISTS post_children_select_parent ON post_children;

-- Simplified policies to avoid recursion
-- Staff can see post_children for posts in their daycare
CREATE POLICY post_children_select_staff ON post_children
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'staff'
  );

-- Parents can see post_children for their own children
CREATE POLICY post_children_select_parent ON post_children
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'parent'
    AND child_id IN (
      SELECT child_id FROM parent_children WHERE parent_id = auth.uid()
    )
  );

-- Add avatar_url column to children table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'children' 
    AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE children ADD COLUMN avatar_url TEXT;
  END IF;
END $$;
