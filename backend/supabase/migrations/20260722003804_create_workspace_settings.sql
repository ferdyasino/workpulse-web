begin;

-- =====================================================
-- TABLE: workspace_settings
-- =====================================================

create table public.workspace_settings (

    workspace_id uuid primary key
        references public.workspaces(id)
        on delete cascade,

    timezone text
        not null
        default 'UTC',

    locale text
        not null
        default 'en-PH',

    currency text
        not null
        default 'PHP',

    metadata jsonb
        not null
        default '{}'::jsonb,

    created_at timestamptz
        not null
        default now(),

    updated_at timestamptz
        not null
        default now()

);

-- =====================================================
-- INDEXES
-- =====================================================

create index idx_workspace_settings_metadata
on public.workspace_settings
using gin(metadata);

-- =====================================================
-- TRIGGER
-- =====================================================

create trigger trg_workspace_settings_updated_at
before update on public.workspace_settings
for each row
execute function public.update_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

comment on table public.workspace_settings is
'Workspace-wide configuration and defaults.';

comment on column public.workspace_settings.timezone is
'Default timezone for reports and newly created shifts.';

comment on column public.workspace_settings.locale is
'Default locale used for formatting dates, numbers and text.';

comment on column public.workspace_settings.currency is
'Default currency used by payroll and financial reports.';

commit;