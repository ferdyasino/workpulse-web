begin;

-- =====================================================
-- TABLE: time_logs
-- =====================================================

create table public.time_logs (

    id uuid primary key
        default gen_random_uuid(),

    log_no text not null unique,

    workspace_id uuid
        not null
        references public.workspaces(id)
        on delete restrict,

    user_id uuid
        not null
        references public.users(id)
        on delete restrict,

    user_shift_id uuid
        not null
        references public.user_shifts(id)
        on delete restrict,

    device_id uuid
        references public.devices(id)
        on delete set null,

    event_type text
        not null
        check (
            event_type in (
                'TIME_IN',
                'TIME_OUT',
                'BREAK_START',
                'BREAK_END',
                'LUNCH_START',
                'LUNCH_END'
            )
        ),

    event_time_utc timestamptz
        not null,

    client_timestamp timestamptz,

    work_date date
        not null,

    timezone text
        not null,

    latitude double precision,

    longitude double precision,

    accuracy double precision,

    ip_address inet,

    user_agent text,

    metadata jsonb
        not null
        default '{}'::jsonb,

    created_at timestamptz
        not null
        default now()

);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_time_logs_workspace
on public.time_logs(workspace_id);

create index idx_time_logs_user
on public.time_logs(user_id);

create index idx_time_logs_work_date
on public.time_logs(work_date);

create index idx_time_logs_event_time
on public.time_logs(event_time_utc);

create index idx_time_logs_user_shift
on public.time_logs(user_shift_id);

create index idx_time_logs_device
on public.time_logs(device_id);

create index idx_time_logs_event_type
on public.time_logs(event_type);

create index idx_time_logs_metadata
on public.time_logs
using gin(metadata);

comment on table public.time_logs is
'Immutable attendance punch events.';

commit;