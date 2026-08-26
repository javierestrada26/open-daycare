-- Add missing index on invitations.invited_by (performance advisory)
create index invitations_invited_by_idx on public.invitations (invited_by);
