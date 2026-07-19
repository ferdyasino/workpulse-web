begin;

create table public.attendance_policies (

    id uuid primary key
        default gen_random_uuid(),

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete cascade,

    name text not null,

    description text,

    -- Time Rules
    grace_minutes integer
        not null
        default 10
        check (grace_minutes >= 0),

    allow_early_time_in boolean
        not null
        default true,

    allow_late_time_out boolean
        not null
        default true,

    -- Break Rules
    allow_breaks boolean
        not null
        default true,

    max_breaks integer,

    max_break_minutes integer,

    -- Lunch Rules
    allow_lunch boolean
        not null
        default true,

    lunch_minutes integer,

    -- Overtime
    allow_overtime boolean
        not null
        default true,

    minimum_overtime_minutes integer
        not null
        default 30,

    -- Status
    status text
        not null
        default 'ACTIVE'
        check (status in ('ACTIVE','INACTIVE')),

    metadata jsonb
        not null
        default '{}'::jsonb,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now(),

    deleted_at timestamptz

);

alter table public.attendance_policies
add constraint attendance_policies_workspace_name_unique
unique (workspace_id, name);

create index idx_attendance_policies_workspace
on public.attendance_policies(workspace_id);

create index idx_attendance_policies_status
on public.attendance_policies(status);

create index idx_attendance_policies_metadata
on public.attendance_policies
using gin(metadata);

create trigger trg_attendance_policies_updated_at
before update on public.attendance_policies
for each row
execute function public.update_updated_at();

commit;