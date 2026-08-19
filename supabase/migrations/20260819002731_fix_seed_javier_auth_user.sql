-- SPEC 08 follow-up: remove the broken staff seed row from auth.users.
--
-- The original seed (20260818004157_create_users_table.sql) inserted
-- javier@google.com directly into auth.users using
-- crypt('Abc123456', gen_salt('bf', 10)) (pgcrypto bcrypt). GoTrue cannot
-- verify pgcrypto-hashed passwords, so signInWithPassword always returned
-- invalid_credentials. The row was also invisible to the Auth Admin API
-- (404 by ID, not listed), making it impossible to update or delete via API.
--
-- This migration removes the row. The user is re-created via the Auth Admin
-- API (admin.createUser with email_confirm=true) so GoTrue owns the password
-- hash. The ON DELETE CASCADE FK on public.users(id) -> auth.users(id) also
-- removes the profile row; the handle_new_auth_user trigger re-creates it
-- from raw_user_meta_data on re-creation.
--
-- Note: for fresh database setups, the original seed migration still inserts
-- the bad row. A future SPEC 08 spec should remove the direct INSERT from the
-- seed migration and document the Admin API re-creation as the canonical flow.

delete from auth.users
where id = 'b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e'
  and email = 'javier@google.com';
