begin;

-- =====================================================
-- TABLE: user_shifts
-- =====================================================

create table public.user_shifts (

    id uuid primary key
        default gen_random_uuid(),

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete cascade,

    user_id uuid
        not null
        references public.users(id)
        on delete cascade,

    shift_id uuid
        not null
        references public.shifts(id)
        on delete restrict,

    effective_from date
        not null,

    effective_to date,

    is_primary boolean
        not null
        default true,

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

alter table public.user_shifts
add constraint chk_user_shifts_dates
check (
    effective_to is null
    or effective_to >= effective_from
);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_user_shifts_workspace
on public.user_shifts(workspace_id);

create index idx_user_shifts_user
on public.user_shifts(user_id);

create index idx_user_shifts_shift
on public.user_shifts(shift_id);

create index idx_user_shifts_dates
on public.user_shifts(effective_from, effective_to);

create index idx_user_shifts_deleted_at
on public.user_shifts(deleted_at);

create index idx_user_shifts_metadata
on public.user_shifts
using gin(metadata);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_user_shifts_updated_at
before update on public.user_shifts
for each row
execute function public.update_updated_at();

comment on table public.user_shifts is
'Historical assignment of shifts to employees.';

commit;