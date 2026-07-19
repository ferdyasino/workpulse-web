do $$
declare
  workspace_uuid uuid;
  department_uuid uuid;
  position_uuid uuid;
  auth_user_uuid uuid;
begin

  insert into public.workspaces (
    name,
    code,
    owner_email
  )
  values (
    'WorkPulse Test Workspace',
    'TEST',
    'admin@test.com'
  )
  returning id into workspace_uuid;


  insert into public.departments (
    workspace_id,
    name,
    status
  )
  values (
    workspace_uuid,
    'IT',
    'ACTIVE'
  )
  returning id into department_uuid;


  insert into public.positions (
    workspace_id,
    title,
    status
  )
  values (
    workspace_uuid,
    'Administrator',
    'ACTIVE'
  )
  returning id into position_uuid;


  insert into auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at
  )
  values (
    gen_random_uuid(),
    'admin@test.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now()
  )
  returning id into auth_user_uuid;


  insert into public.users (
    id,
    workspace_id,
    department_id,
    position_id,
    employee_no,
    email,
    first_name,
    last_name,
    display_name
  )
  values (
    auth_user_uuid,
    workspace_uuid,
    department_uuid,
    position_uuid,
    'EMP-001',
    'admin@test.com',
    'Test',
    'Admin',
    'Test Admin'
  );

end $$;