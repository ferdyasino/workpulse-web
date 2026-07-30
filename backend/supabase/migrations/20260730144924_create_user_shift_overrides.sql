begin;

create table if not exists public.user_shift_overrides (
    id uuid primary key default gen_random_uuid(),

    workspace_id uuid not null
        references public.workspaces(id)
        on delete cascade,

    user_id uuid not null
        references public.users(id)
        on delete cascade,

    shift_id uuid not null
        references public.shifts(id)
        on delete restrict,

    effective_from date not null,

    effective_to date,

    reason text,

    metadata jsonb default '{}'::jsonb,

    created_at timestamptz not null default now(),

    deleted_at timestamptz
);


create index if not exists idx_user_shift_overrides_user
on public.user_shift_overrides(user_id);


create index if not exists idx_user_shift_overrides_workspace
on public.user_shift_overrides(workspace_id);


create index if not exists idx_user_shift_overrides_dates
on public.user_shift_overrides(
    user_id,
    effective_from,
    effective_to
);


commit;
