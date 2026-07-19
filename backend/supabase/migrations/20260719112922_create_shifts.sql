begin;

-- =====================================================
-- TABLE: shifts
-- =====================================================

create table public.shifts (

    id uuid primary key
        default gen_random_uuid(),

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete cascade,

    name text not null,

    description text,

    start_time time not null,

    end_time time not null,

    timezone text not null,

    grace_minutes integer
        not null
        default 10
        check (grace_minutes >= 0),

    break_minutes integer
        not null
        default 60
        check (break_minutes >= 0),

    status text
        not null
        default 'ACTIVE'
        check (
            status in (
                'ACTIVE',
                'INACTIVE'
            )
        ),

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

-- =====================================================
-- CONSTRAINTS
-- =====================================================

alter table public.shifts
add constraint shifts_workspace_name_unique
unique (workspace_id, name);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_shifts_workspace
on public.shifts(workspace_id);

create index idx_shifts_status
on public.shifts(status);

create index idx_shifts_deleted_at
on public.shifts(deleted_at);

create index idx_shifts_timezone
on public.shifts(timezone);

create index idx_shifts_metadata
on public.shifts
using gin(metadata);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_shifts_updated_at
before update on public.shifts
for each row
execute function public.update_updated_at();

commit;