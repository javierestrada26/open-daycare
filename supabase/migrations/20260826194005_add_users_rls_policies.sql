-- Add RLS policies for users table
-- The users table has RLS enabled but no policies, blocking all access

-- Allow users to read their own row
CREATE POLICY "users_select_self"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Allow users in the same daycare to read each other
-- Needed for displaying names in posts, comments, invitations, etc.
CREATE POLICY "users_select_same_daycare"
ON public.users
FOR SELECT
TO authenticated
USING (daycare_id = current_daycare_id());

-- Allow users to update their own profile
CREATE POLICY "users_update_self"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow staff to update other users in the same daycare
CREATE POLICY "users_update_staff"
ON public.users
FOR UPDATE
TO authenticated
USING (
  current_user_role() IN ('staff'::user_role, 'admin'::user_role)
  AND daycare_id = current_daycare_id()
)
WITH CHECK (
  current_user_role() IN ('staff'::user_role, 'admin'::user_role)
  AND daycare_id = current_daycare_id()
);

-- Allow staff to insert users in the same daycare
-- Note: Most inserts are handled by the handle_new_auth_user trigger (SECURITY DEFINER)
-- This policy allows direct inserts if needed
CREATE POLICY "users_insert_staff"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  current_user_role() IN ('staff'::user_role, 'admin'::user_role)
  AND daycare_id = current_daycare_id()
);
