begin;

-- =====================================================
-- PLATFORM OWNER SUPPORT
-- Allow a user to exist without a workspace.
-- =====================================================

alter table public.users
  alter column workspace_id drop not null;

commit;
