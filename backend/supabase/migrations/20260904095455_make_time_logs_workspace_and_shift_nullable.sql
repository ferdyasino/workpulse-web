alter table public.time_logs
  alter column workspace_id drop not null;

alter table public.time_logs
  alter column user_shift_id drop not null;