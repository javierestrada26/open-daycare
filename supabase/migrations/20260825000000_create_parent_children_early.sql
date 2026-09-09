-- Enum relationship_type (movido desde 20260826145026)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'relationship_type') then
    create type public.relationship_type as enum ('father', 'mother', 'guardian');
  end if;
end $$;

-- Tabla parent_children (movida desde 20260826145026)
-- Necesaria antes de posts porque las policies de posts la referencian.
create table if not exists public.parent_children (
  id           uuid primary key default gen_random_uuid(),
  parent_id    uuid not null references public.users(id) on delete cascade,
  child_id     uuid not null references public.children(id) on delete restrict,
  relationship public.relationship_type not null,
  created_at   timestamptz not null default now(),
  unique (parent_id, child_id)
);

create index if not exists parent_children_parent_id_idx on public.parent_children (parent_id);
create index if not exists parent_children_child_id_idx  on public.parent_children (child_id);

alter table public.parent_children enable row level security;
alter table public.parent_children force  row level security;
