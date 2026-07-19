begin;

alter table public.user_shifts
add column attendance_policy_id uuid
references public.attendance_policies(id)
on delete restrict;

create index idx_user_shifts_attendance_policy
on public.user_shifts(attendance_policy_id);

commit;