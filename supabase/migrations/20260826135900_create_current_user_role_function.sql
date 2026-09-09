-- Helper: rol del usuario autenticado
-- Movido aquí desde 20260826145026 para resolver dependencia:
-- las policies de posts (20260826140000) necesitan esta función.
create or replace function public.current_user_role()
returns public.user_role
language sql security definer set search_path = public
as $$ select u.role from public.users u where u.id = (select auth.uid()) $$;

revoke execute on function public.current_user_role() from public, anon;
grant execute on function public.current_user_role() to authenticated;
