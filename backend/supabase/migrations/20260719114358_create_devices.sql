begin;

-- =====================================================
-- TABLE: devices
-- =====================================================

create table public.devices (

    id uuid primary key
        default gen_random_uuid(),

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete cascade,

    user_id uuid
        not null
        references public.users(id)
        on delete cascade,

    device_name text,

    device_type text
        not null
        default 'UNKNOWN'
        check (
            device_type in (
                'DESKTOP',
                'LAPTOP',
                'TABLET',
                'PHONE',
                'KIOSK',
                'UNKNOWN'
            )
        ),

    operating_system text,

    browser text,

    fingerprint text
        not null,

    trusted boolean
        not null
        default false,

    last_seen_at timestamptz,

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

alter table public.devices
add constraint devices_fingerprint_unique
unique (fingerprint);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_devices_workspace
on public.devices(workspace_id);

create index idx_devices_user
on public.devices(user_id);

create index idx_devices_trusted
on public.devices(trusted);

create index idx_devices_deleted_at
on public.devices(deleted_at);

create index idx_devices_metadata
on public.devices
using gin(metadata);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_devices_updated_at
before update on public.devices
for each row
execute function public.update_updated_at();

comment on table public.devices is
'Registered devices used for authentication and attendance logging.';

commit;