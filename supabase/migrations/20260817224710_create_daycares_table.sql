create table public.daycares (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.daycares enable row level security;
alter table public.daycares force row level security;

-- seed determinista (UUID fijo para paridad local/remoto y FK estable)
insert into public.daycares (id, name) values
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Guardería Sala Soles');
