-- ============================================================================
-- Migrate existing user/workspace relationships
--
-- This copies the current users.workspace_id relationship into the new
-- workspace_members table.
--
-- IMPORTANT:
-- users.workspace_id is intentionally NOT removed yet.
-- ============================================================================

insert into public.workspace_members (
  workspace_id,
  user_id,
  role,
  department_id,
  position_id,
  employee_no,
  employment_type,
  employment_status,
  status,
  created_at,
  updated_at,
  deleted_at
)
select
  u.workspace_id,
  u.id,
  u.role,
  u.department_id,
  u.position_id,
  u.employee_no,
  u.employment_type,
  u.employment_status,
  case
    when u.deleted_at is null then 'active'
    else 'inactive'
  end,
  u.created_at,
  u.updated_at,
  u.deleted_at
from public.users u
where u.workspace_id is not null
on conflict (workspace_id, user_id) do nothing;