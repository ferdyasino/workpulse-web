begin;

-- =====================================================
-- AUTHENTICATION SETTINGS
-- =====================================================

alter table public.users
add column if not exists login_provider text
    not null
    default 'GOOGLE';

alter table public.users
add column if not exists auth_enabled boolean
    not null
    default true;

alter table public.users
add column if not exists invited_at timestamptz;

alter table public.users
add column if not exists last_login_at timestamptz;

-- =====================================================
-- CONSTRAINTS
-- =====================================================

alter table public.users
drop constraint if exists users_login_provider_check;

alter table public.users
add constraint users_login_provider_check
check (
    login_provider in (
        'EMAIL',
        'GOOGLE',
        'BOTH'
    )
);

-- =====================================================
-- COMMENTS
-- =====================================================

comment on column public.users.login_provider is
'Allowed authentication provider for this employee.';

comment on column public.users.auth_enabled is
'Whether this employee is allowed to authenticate.';

comment on column public.users.invited_at is
'Timestamp when the employee invitation was sent.';

comment on column public.users.last_login_at is
'Timestamp of the employee''s last successful login.';

commit;
