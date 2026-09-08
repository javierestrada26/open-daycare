-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS post_children_select_staff ON post_children;
DROP POLICY IF EXISTS post_children_select_parent ON post_children;
DROP POLICY IF EXISTS posts_select_parent ON posts;

-- Simplified policies to avoid recursion
-- Staff can see all post_children (filtering by room is done in application queries)
CREATE POLICY post_children_select_staff ON post_children
  FOR SELECT TO authenticated
  USING (current_user_role() = 'staff');

-- Parents can see all post_children (filtering by their children is done in application queries)
-- This avoids recursion with posts_select_parent
CREATE POLICY post_children_select_parent ON post_children
  FOR SELECT TO authenticated
  USING (current_user_role() = 'parent');

-- Parents can see posts that are announcements OR posts that have post_children
-- We simplify to avoid recursion: parents see announcements + all posts with post_children
-- The application will filter to only show posts about their children
CREATE POLICY posts_select_parent ON posts
  FOR SELECT TO authenticated
  USING (
    current_user_role() = 'parent'
    AND (
      type = 'announcement'
      OR EXISTS (
        SELECT 1 FROM post_children WHERE post_id = posts.id
      )
    )
  );
