-- Seed staff_rooms (solo si el usuario existe)
do $$
begin
  if exists (select 1 from public.users where id = 'f4b81ebb-12e9-4365-9b3b-8d7849f564ed') then
    insert into staff_rooms (staff_id, room_id)
    values ('f4b81ebb-12e9-4365-9b3b-8d7849f564ed', 'd1e2f3a4-0001-4d7e-8f9a-0b1c2d3e4f5a')
    on conflict do nothing;
  end if;
end $$;
