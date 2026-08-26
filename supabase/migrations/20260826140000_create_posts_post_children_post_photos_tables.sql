-- ENUM post_type (doc §7)
create type public.post_type as enum ('meal', 'nap', 'activity', 'achievement', 'photo', 'announcement');

-- Tabla posts (doc §7)
create table public.posts (
  id           uuid primary key default gen_random_uuid(),
  author_id    uuid not null references public.users(id) on delete restrict,
  room_id      uuid references public.rooms(id) on delete set null,
  type         public.post_type not null,
  title        text,
  body         text not null,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index posts_author_id_idx  on public.posts (author_id);
create index posts_room_id_idx    on public.posts (room_id);
create index posts_type_idx       on public.posts (type);
create index posts_published_at_idx on public.posts (published_at desc);

alter table public.posts enable row level security;
alter table public.posts force  row level security;

-- Tabla post_children (doc §8) — PK compuesta
create table public.post_children (
  post_id  uuid not null references public.posts(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  primary key (post_id, child_id)
);

create index post_children_child_id_idx on public.post_children (child_id);

alter table public.post_children enable row level security;
alter table public.post_children force  row level security;

-- Tabla post_photos (doc §9)
create table public.post_photos (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  url        text not null,
  width      int,
  height     int,
  position   int not null default 0,
  created_at timestamptz not null default now()
);

create index post_photos_post_id_idx on public.post_photos (post_id);

alter table public.post_photos enable row level security;
alter table public.post_photos force  row level security;

-- Policies: posts
-- Staff can see all posts in their daycare
create policy posts_select_staff on public.posts
  for select to authenticated
  using (
    public.current_user_role() = 'staff'
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = posts.room_id
          and r.daycare_id = public.current_daycare_id()
      )
    )
  );

-- Parents can see posts that tag their children + general announcements for their daycare
create policy posts_select_parent on public.posts
  for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and (
      exists (
        select 1 from public.post_children pc
        join public.parent_children pcn on pcn.child_id = pc.child_id
        where pc.post_id = posts.id
          and pcn.parent_id = (select auth.uid())
      )
      or (
        posts.type = 'announcement'
        and posts.room_id is not null
        and exists (
          select 1 from public.children c
          join public.parent_children pc on pc.child_id = c.id
          where c.room_id = posts.room_id
            and pc.parent_id = (select auth.uid())
        )
      )
    )
  );

-- Staff can insert posts for their daycare
create policy posts_insert_staff on public.posts
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and public.current_user_role() = 'staff'
    and (
      room_id is null
      or exists (
        select 1 from public.rooms r
        where r.id = posts.room_id
          and r.daycare_id = public.current_daycare_id()
      )
    )
  );

-- Staff can update their own posts
create policy posts_update_staff on public.posts
  for update to authenticated
  using (
    author_id = (select auth.uid())
    and public.current_user_role() = 'staff'
  );

-- Staff can delete their own posts
create policy posts_delete_staff on public.posts
  for delete to authenticated
  using (
    author_id = (select auth.uid())
    and public.current_user_role() = 'staff'
  );

-- Policies: post_children
-- Staff can manage post_children for posts in their daycare
create policy post_children_select_staff on public.post_children
  for select to authenticated
  using (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.posts p
      join public.rooms r on r.id = p.room_id
      where p.id = post_children.post_id
        and r.daycare_id = public.current_daycare_id()
    )
  );

-- Parents can see post_children for their own children
create policy post_children_select_parent on public.post_children
  for select to authenticated
  using (
    public.current_user_role() = 'parent'
    and exists (
      select 1 from public.parent_children pc
      where pc.child_id = post_children.child_id
        and pc.parent_id = (select auth.uid())
    )
  );

-- Staff can insert post_children
create policy post_children_insert_staff on public.post_children
  for insert to authenticated
  with check (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.posts p
      where p.id = post_children.post_id
        and p.author_id = (select auth.uid())
    )
  );

-- Policies: post_photos
-- Anyone who can see the post can see its photos
create policy post_photos_select on public.post_photos
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = post_photos.post_id
    )
  );

-- Staff can manage photos for their posts
create policy post_photos_insert_staff on public.post_photos
  for insert to authenticated
  with check (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.posts p
      where p.id = post_photos.post_id
        and p.author_id = (select auth.uid())
    )
  );

create policy post_photos_delete_staff on public.post_photos
  for delete to authenticated
  using (
    public.current_user_role() = 'staff'
    and exists (
      select 1 from public.posts p
      where p.id = post_photos.post_id
        and p.author_id = (select auth.uid())
    )
  );
