begin;

-- =====================================================
-- TABLE: positions
-- =====================================================

create table public.positions (

    id uuid primary key
        default gen_random_uuid(),

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete cascade,

    title text not null,

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

alter table public.positions
add constraint positions_workspace_title_unique
unique (workspace_id, title);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_positions_workspace
on public.positions(workspace_id);

create index idx_positions_status
on public.positions(status);

create index idx_positions_deleted_at
on public.positions(deleted_at);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_positions_updated_at
before update on public.positions
for each row
execute function public.update_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

comment on table public.positions is
'Job positions available within a workspace.';

comment on column public.positions.title is
'Position title such as Agent, Supervisor, HR Manager.';

commit;