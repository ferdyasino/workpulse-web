begin;

-- =====================================================
-- TABLE: departments
-- =====================================================

create table public.departments (

    id uuid primary key
        default gen_random_uuid(),

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete cascade,

    name text not null,

    description text,

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

alter table public.departments
add constraint departments_workspace_name_unique
unique (workspace_id, name);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_departments_workspace
on public.departments(workspace_id);

create index idx_departments_status
on public.departments(status);

create index idx_departments_deleted_at
on public.departments(deleted_at);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_departments_updated_at
before update on public.departments
for each row
execute function public.update_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

comment on table public.departments is
'Departments belonging to a workspace.';

comment on column public.departments.workspace_id is
'Workspace that owns the department.';

commit;