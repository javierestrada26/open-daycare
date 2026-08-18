-- Extension required for crypt() / gen_salt() used in the staff seed password
create extension if not exists pgcrypto;

-- Enums
create type public.user_role as enum ('staff', 'parent', 'admin');
create type public.user_status as enum ('pending', 'active');

-- Tabla
create table public.users (
  id                    uuid primary key references auth.users(id) on delete cascade,
  daycare_id            uuid not null references public.daycares(id) on delete restrict,
  role                  public.user_role   not null,
  status                public.user_status not null default 'active',
  full_name             text not null,
  avatar_url            text,
  notify_on_post        boolean not null default true,
  daily_summary_enabled boolean not null default true,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index users_daycare_id_idx on public.users (daycare_id);

alter table public.users enable row level security;
alter table public.users force  row level security;

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

-- Perfil auto-creado desde auth.users
create or replace function public.handle_new_auth_user()
returns trigger
security definer
set search_path = public
language plpgsql as $$
declare
  v_daycare_id uuid;
  v_role       text;
  v_full_name  text;
begin
  v_daycare_id := new.raw_user_meta_data->>'daycare_id';
  v_role       := new.raw_user_meta_data->>'role';
  v_full_name  := new.raw_user_meta_data->>'full_name';
  if v_daycare_id is null or v_role is null or v_full_name is null then
    return new;  -- sin metadata: no crea perfil (lo maneja la app / invitations)
  end if;
  insert into public.users (id, daycare_id, role, full_name)
  values (new.id, v_daycare_id::uuid, v_role::public.user_role, v_full_name);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

revoke execute on function public.set_updated_at()       from public, anon, authenticated;
revoke execute on function public.handle_new_auth_user()  from public, anon, authenticated;

-- Seed staff (el trigger on_auth_user_created inserta el perfil en public.users)
insert into auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  'b0c1d2e3-f4a5-6b7c-8d9e-0f1a2b3c4d5e',
  'authenticated', 'authenticated',
  'javier@google.com',
  crypt('Abc123456', gen_salt('bf', 10)),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"daycare_id":"a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d","role":"staff","full_name":"Javier"}'::jsonb,
  now(), now()
)
on conflict (id) do nothing;
