-- =====================================================
-- WORKPULSE SAMPLE SEED DATA
-- =====================================================

-- Workspace
insert into public.workspaces (
    id,
    code,
    name,
    owner_email,
    status
)
values (
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'LT-001',
    'LT Outsourcing',
    'ferdyasino@gmail.com',
    'ACTIVE'
)
on conflict (id) do nothing;



-- =====================================================
-- Departments
-- =====================================================

insert into public.departments (
    id,
    workspace_id,
    name,
    description,
    status
)
values

(
    '10000000-0000-0000-0000-000000000001',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'IT Department',
    'Technical support and infrastructure',
    'ACTIVE'
),

(
    '10000000-0000-0000-0000-000000000002',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'Operations',
    'Daily operations',
    'ACTIVE'
)

on conflict (id) do nothing;



-- =====================================================
-- Positions
-- =====================================================

insert into public.positions (
    id,
    workspace_id,
    title,
    description,
    status
)
values

(
    '20000000-0000-0000-0000-000000000001',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'System Administrator',
    'Manages infrastructure',
    'ACTIVE'
),

(
    '20000000-0000-0000-0000-000000000002',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'Support Specialist',
    'Handles technical support',
    'ACTIVE'
)

on conflict (id) do nothing;



-- =====================================================
-- Attendance Policy
-- =====================================================

insert into public.attendance_policies (
    id,
    workspace_id,
    name,
    description,
    grace_minutes,
    lunch_minutes,
    max_break_minutes,
    max_breaks,
    minimum_overtime_minutes,
    allow_breaks,
    allow_lunch,
    allow_overtime,
    status,
    metadata
)
values
(
    '30000000-0000-0000-0000-000000000001',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'Default Policy',
    'Standard attendance policy',
    10,
    60,
    60,
    2,
    30,
    true,
    true,
    true,
    'ACTIVE',
    '{}'::jsonb
)

on conflict(id) do nothing;



-- =====================================================
-- Shifts
-- =====================================================

insert into public.shifts (
    id,
    workspace_id,
    name,
    start_time,
    end_time,
    timezone,
    break_minutes,
    grace_minutes,
    status,
    metadata
)
values

(
    '40000000-0000-0000-0000-000000000001',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'Day Shift',
    '09:00',
    '18:00',
    'Asia/Manila',
    60,
    10,
    'ACTIVE',
    '{}'::jsonb
),

(
    '40000000-0000-0000-0000-000000000002',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'US Night Shift',
    '21:00',
    '06:00',
    'America/New_York',
    60,
    10,
    'ACTIVE',
    '{}'::jsonb
)

on conflict(id) do nothing;



-- =====================================================
-- Users
-- =====================================================

insert into public.users (
    id,
    workspace_id,
    employee_no,
    email,
    first_name,
    last_name,
    display_name,
    department_id,
    position_id,
    role,
    employment_status,
    employment_type,
    metadata
)
values

(
    '8f8b9730-3078-48b2-a371-ec4987cea051',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'EMP-001',
    'ferdyasino@gmail.com',
    'Ferdinand',
    'Asino',
    'Ferdinand Asino',
    '10000000-0000-0000-0000-000000000001',
    '20000000-0000-0000-0000-000000000001',
    'OWNER',
    'ACTIVE',
    'FULL_TIME',
    '{}'::jsonb
),

(
    '8f8b9730-3078-48b2-a371-ec4987cea052',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    'EMP-002',
    'employee@example.com',
    'John',
    'Doe',
    'John Doe',
    '10000000-0000-0000-0000-000000000002',
    '20000000-0000-0000-0000-000000000002',
    'EMPLOYEE',
    'ACTIVE',
    'FULL_TIME',
    '{}'::jsonb
)

on conflict(id) do nothing;



-- =====================================================
-- User Shifts
-- =====================================================

insert into public.user_shifts (
    id,
    workspace_id,
    user_id,
    shift_id,
    attendance_policy_id,
    effective_from,
    is_primary,
    metadata
)
values

(
    '50000000-0000-0000-0000-000000000001',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    '8f8b9730-3078-48b2-a371-ec4987cea051',
    '40000000-0000-0000-0000-000000000001',
    '30000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    true,
    '{}'::jsonb
),

(
    '50000000-0000-0000-0000-000000000002',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    '8f8b9730-3078-48b2-a371-ec4987cea052',
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    true,
    '{}'::jsonb
)

on conflict(id) do nothing;



-- =====================================================
-- Device
-- =====================================================

insert into public.devices (
    id,
    workspace_id,
    user_id,
    fingerprint,
    device_type,
    browser,
    operating_system,
    trusted,
    metadata
)
values
(
    '60000000-0000-0000-0000-000000000001',
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    '8f8b9730-3078-48b2-a371-ec4987cea051',
    'ferdy-dev-machine',
    'DESKTOP',
    'Chrome',
    'Windows 11',
    true,
    '{}'::jsonb
)

on conflict(id) do nothing;



-- =====================================================
-- Time Logs Sample
-- =====================================================

insert into public.time_logs (
    workspace_id,
    user_id,
    user_shift_id,
    event_type,
    event_time_utc,
    client_timestamp,
    timezone,
    work_date,
    log_no,
    metadata
)
values

(
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    '8f8b9730-3078-48b2-a371-ec4987cea051',
    '50000000-0000-0000-0000-000000000001',
    'TIME_IN',
    '2026-07-21T09:00:00Z',
    '2026-07-21T09:00:00Z',
    'Asia/Manila',
    '2026-07-21',
    gen_random_uuid(),
    '{"device":"seed"}'::jsonb
),

(
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    '8f8b9730-3078-48b2-a371-ec4987cea051',
    '50000000-0000-0000-0000-000000000001',
    'BREAK_START',
    '2026-07-21T12:00:00Z',
    '2026-07-21T12:00:00Z',
    'Asia/Manila',
    '2026-07-21',
    gen_random_uuid(),
    '{"device":"seed"}'::jsonb
),

(
    'b5edffc0-e071-4889-b79e-fa7b506f1b19',
    '8f8b9730-3078-48b2-a371-ec4987cea051',
    '50000000-0000-0000-0000-000000000001',
    'BREAK_END',
    '2026-07-21T12:30:00Z',
    '2026-07-21T12:30:00Z',
    'Asia/Manila',
    '2026-07-21',
    gen_random_uuid(),
    '{"device":"seed"}'::jsonb
);