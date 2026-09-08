-- ============================================================================
-- Workspace Members
--
-- Allows one global user to belong to multiple workspaces.
-- Workspace-specific employee information lives here.
-- ============================================================================

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null
    references public.workspaces(id)
    on delete cascade,

  user_id uuid not null
    references public.users(id)
    on delete cascade,

  -- Workspace-specific authorization
  role text not null default 'employee',

  -- Workspace-specific organization
  department_id uuid null
    references public.departments(id)
    on delete set null,

  position_id uuid null
    references public.positions(id)
    on delete set null,

  -- Workspace-specific employee information
  employee_no text null,

  employment_type text null,

  employment_status text null,

  -- Membership lifecycle
  status text not null default 'active',

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  deleted_at timestamptz null,

  -- A user can only have one membership per workspace.
  constraint workspace_members_unique
    unique (workspace_id, user_id),

  constraint workspace_members_status_check
    check (
      status in ('active', 'inactive', 'suspended')
    )
);

-- ============================================================================
-- Indexes
-- ============================================================================

create index workspace_members_user_id_idx
  on public.workspace_members(user_id);

create index workspace_members_workspace_id_idx
  on public.workspace_members(workspace_id);

create index workspace_members_user_workspace_idx
  on public.workspace_members(user_id, workspace_id);

create index workspace_members_active_idx
  on public.workspace_members(workspace_id, status)
  where deleted_at is null;