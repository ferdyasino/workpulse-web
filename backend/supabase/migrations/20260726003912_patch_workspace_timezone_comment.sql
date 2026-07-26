begin;

-- =====================================================
-- PATCH: workspace timezone semantics
-- =====================================================

comment on column public.settings.timezone is
'Default timezone for workspace display, reports, exports, and new configuration defaults. Attendance calculations use the assigned shift timezone.';

commit;