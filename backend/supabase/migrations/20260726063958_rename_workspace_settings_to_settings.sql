alter table public.workspace_settings
rename to settings;

alter index public.workspace_settings_pkey
rename to settings_pkey;

alter index public.idx_workspace_settings_metadata
rename to idx_settings_metadata;

alter table public.settings
rename constraint workspace_settings_workspace_id_fkey
to settings_workspace_id_fkey;