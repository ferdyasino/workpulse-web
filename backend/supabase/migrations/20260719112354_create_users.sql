begin;

-- =====================================================
-- TABLE: users
-- =====================================================

create table public.users (

    -- Authentication (same UUID as auth.users)
    id uuid primary key
        references auth.users(id)
        on delete cascade,

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete cascade,

    department_id uuid
        references public.departments(id)
        on delete set null,

    position_id uuid
        references public.positions(id)
        on delete set null,

    -- Employee
    employee_no text not null,

    email text not null,

    first_name text not null,

    middle_name text,

    last_name text not null,

    display_name text not null,

    avatar_url text,

    -- Employment
    role text
        not null
        default 'EMPLOYEE'
        check (
            role in (
                'OWNER',
                'ADMIN',
                'HR',
                'SUPERVISOR',
                'EMPLOYEE'
            )
        ),

    employment_status text
        not null
        default 'ACTIVE'
        check (
            employment_status in (
                'ACTIVE',
                'INACTIVE',
                'ON_LEAVE',
                'RESIGNED',
                'TERMINATED'
            )
        ),

    employment_type text
        not null
        default 'FULL_TIME'
        check (
            employment_type in (
                'FULL_TIME',
                'PART_TIME',
                'CONTRACT',
                'INTERN'
            )
        ),

    hire_date date,

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

alter table public.users
add constraint users_workspace_employee_no_unique
unique (workspace_id, employee_no);

alter table public.users
add constraint users_workspace_email_unique
unique (workspace_id, email);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_users_workspace
on public.users(workspace_id);

create index idx_users_department
on public.users(department_id);

create index idx_users_position
on public.users(position_id);

create index idx_users_role
on public.users(role);

create index idx_users_status
on public.users(employment_status);

create index idx_users_deleted_at
on public.users(deleted_at);

create index idx_users_metadata
on public.users
using gin(metadata);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_users_updated_at
before update on public.users
for each row
execute function public.update_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

comment on table public.users is
'Employee profile linked to Supabase Auth.';

comment on column public.users.id is
'Same UUID as auth.users.id.';

comment on column public.users.metadata is
'Extensible JSON data for optional employee attributes.';

commit;