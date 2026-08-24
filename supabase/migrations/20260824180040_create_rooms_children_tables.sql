-- Enum
create type public.child_status as enum ('active', 'archived');

-- Tabla rooms
create table public.rooms (
  id         uuid primary key default gen_random_uuid(),
  daycare_id uuid not null references public.daycares(id) on delete restrict,
  name       text not null,
  created_at timestamptz not null default now()
);

create index rooms_daycare_id_idx on public.rooms (daycare_id);

alter table public.rooms enable row level security;
alter table public.rooms force  row level security;

-- Tabla children
create table public.children (
  id            uuid primary key default gen_random_uuid(),
  room_id        uuid not null references public.rooms(id) on delete restrict,
  full_name      text not null,
  birth_date     date not null,
  enrolled_at    date not null default current_date,
  medical_notes  text,
  allergy_tags   text[] not null default '{}',
  photo_consent  boolean not null default true,
  status         public.child_status not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index children_room_id_idx on public.children (room_id);

create trigger children_set_updated_at
  before update on public.children
  for each row execute function public.set_updated_at();

alter table public.children enable row level security;
alter table public.children force  row level security;

-- Helper: daycare_id del usuario autenticado (bypassa el RLS de public.users
-- que hoy no tiene policies — SPEC 09 las difirió). Patrón security definer
-- igual que handle_new_auth_user() en SPEC 08.
create or replace function public.current_daycare_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select u.daycare_id from public.users u where u.id = (select auth.uid());
$$;

revoke execute on function public.current_daycare_id() from public, anon;
grant   execute on function public.current_daycare_id() to authenticated;

-- Policies por daycare
create policy rooms_select_same_daycare on public.rooms
  for select to authenticated
  using (daycare_id = public.current_daycare_id());

create policy children_select_same_daycare on public.children
  for select to authenticated
  using (
    exists (
      select 1 from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

create policy children_insert_same_daycare on public.children
  for insert to authenticated
  with check (
    exists (
      select 1 from public.rooms r
      where r.id = children.room_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

-- Seed de 3 salas (UUIDs fijos, created_at escalonado para orden estable)
insert into public.rooms (id, daycare_id, name, created_at) values
  ('d1e2f3a4-0001-4d7e-8f9a-0b1c2d3e4f5a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Soles',     now()),
  ('d1e2f3a4-0002-4d7e-8f9a-0b1c2d3e4f5a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Lunas',     now() + interval '1 minute'),
  ('d1e2f3a4-0003-4d7e-8f9a-0b1c2d3e4f5a', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Estrellas', now() + interval '2 minutes')
on conflict (id) do nothing;
