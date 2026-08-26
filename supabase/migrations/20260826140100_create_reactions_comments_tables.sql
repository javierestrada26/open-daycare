-- Tabla reactions (doc §10)
create table public.reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.users(id) on delete cascade,
  type       text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index reactions_post_id_idx on public.reactions (post_id);
create index reactions_user_id_idx on public.reactions (user_id);

alter table public.reactions enable row level security;
alter table public.reactions force  row level security;

-- Tabla comments (doc §11)
create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid not null references public.users(id) on delete restrict,
  body       text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index comments_post_id_idx  on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);

alter table public.comments enable row level security;
alter table public.comments force  row level security;

-- Policies: reactions
-- Anyone who can see the post can see its reactions
create policy reactions_select on public.reactions
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = reactions.post_id
    )
  );

-- Authenticated users can add reactions (to posts they can see)
create policy reactions_insert on public.reactions
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = reactions.post_id
    )
  );

-- Users can delete their own reactions
create policy reactions_delete on public.reactions
  for delete to authenticated
  using (
    user_id = (select auth.uid())
  );

-- Policies: comments
-- Anyone who can see the post can see its comments
create policy comments_select on public.comments
  for select to authenticated
  using (
    exists (
      select 1 from public.posts p
      where p.id = comments.post_id
    )
  );

-- Authenticated users can add comments (to posts they can see)
create policy comments_insert on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (
      select 1 from public.posts p
      where p.id = comments.post_id
    )
  );

-- Users can update their own comments
create policy comments_update on public.comments
  for update to authenticated
  using (
    author_id = (select auth.uid())
  );

-- Users can delete their own comments
create policy comments_delete on public.comments
  for delete to authenticated
  using (
    author_id = (select auth.uid())
  );
