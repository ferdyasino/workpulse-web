begin;

-- =====================================================
-- TABLE: workspaces
-- =====================================================

create table public.workspaces (

    id uuid primary key
        default gen_random_uuid(),

    name text not null,

    code text not null,

    owner_email text,

    status text
        not null
        default 'ACTIVE'
        check (status in (
            'ACTIVE',
            'INACTIVE'
        )),

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

alter table public.workspaces
add constraint workspaces_code_unique
unique (code);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_workspaces_name
on public.workspaces(name);

create index idx_workspaces_status
on public.workspaces(status);

create index idx_workspaces_deleted_at
on public.workspaces(deleted_at);

-- =====================================================
-- TRIGGERS
-- =====================================================

create trigger trg_workspaces_updated_at
before update on public.workspaces
for each row
execute function public.update_updated_at();

commit;