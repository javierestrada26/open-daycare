-- Tabla daily_summaries (doc §12)
create table public.daily_summaries (
  id               uuid primary key default gen_random_uuid(),
  child_id         uuid not null references public.children(id) on delete cascade,
  date             date not null,
  meals_count      int not null default 0,
  sleep_minutes    int not null default 0,
  activities_count int not null default 0,
  mood             text,
  highlight        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (child_id, date)
);

create index daily_summaries_child_id_idx on public.daily_summaries (child_id);
create index daily_summaries_date_idx     on public.daily_summaries (date desc);

alter table public.daily_summaries enable row level security;
alter table public.daily_summaries force  row level security;

-- Tabla devices (doc §13 — optional, push notifications)
create table public.devices (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  token      text not null,
  platform   text not null,
  created_at timestamptz not null default now()
);

create index devices_user_id_idx on public.devices (user_id);

alter table public.devices enable row level security;
alter table public.devices force  row level security;

-- Policies: daily_summaries
-- Staff can see all daily summaries in their daycare
create policy daily_summaries_select_staff on public.daily_summaries
  for select to authenticated
  using (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = daily_summaries.child_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

-- Parents can see daily summaries for their own children
create policy daily_summaries_select_parent on public.daily_summaries
  for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and exists (
      select 1 from public.parent_children pc
      where pc.child_id = daily_summaries.child_id
        and pc.parent_id = (select auth.uid())
    )
  );

-- Staff can manage daily summaries for children in their daycare
create policy daily_summaries_insert_staff on public.daily_summaries
  for insert to authenticated
  with check (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = daily_summaries.child_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

create policy daily_summaries_update_staff on public.daily_summaries
  for update to authenticated
  using (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.children c
      join public.rooms r on r.id = c.room_id
      where c.id = daily_summaries.child_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

-- Policies: devices
-- Users can see their own devices
create policy devices_select on public.devices
  for select to authenticated
  using (
    user_id = (select auth.uid())
  );

-- Users can manage their own devices
create policy devices_insert on public.devices
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
  );

create policy devices_update on public.devices
  for update to authenticated
  using (
    user_id = (select auth.uid())
  );

create policy devices_delete on public.devices
  for delete to authenticated
  using (
    user_id = (select auth.uid())
  );
