-- Enum
create type public.invitation_status as enum ('pending', 'accepted', 'expired', 'cancelled');

-- Tabla invitations (doc §6)
create table public.invitations (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children(id) on delete restrict,
  invited_by   uuid not null references public.users(id) on delete restrict,
  full_name    text not null,
  email        text not null,
  relationship public.relationship_type not null,
  code         text not null unique,
  status       public.invitation_status not null default 'pending',
  expires_at   timestamptz not null,
  accepted_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index invitations_child_id_idx on public.invitations (child_id);
create index invitations_invited_by_idx on public.invitations (invited_by);

alter table public.invitations enable row level security;
alter table public.invitations force  row level security;

-- Policies
create policy invitations_select_staff_same_daycare on public.invitations
  for select to authenticated
  using (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

create policy invitations_insert_staff_same_daycare on public.invitations
  for insert to authenticated
  with check (
    invited_by = (select auth.uid())
    and public.current_user_role() = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = invitations.child_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

create policy parent_children_select_staff_or_self on public.parent_children
  for select to authenticated
  using (
    parent_id = (select auth.uid())
    or (
      public.current_user_role() = 'staff'
      and exists (
        select 1 from public.children c
        join public.rooms r on r.id = c.room_id
        where c.id = parent_children.child_id
          and r.daycare_id = public.current_daycare_id()
      )
    )
  );
