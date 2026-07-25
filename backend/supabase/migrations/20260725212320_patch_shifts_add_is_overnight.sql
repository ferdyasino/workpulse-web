begin;

-- =====================================================
-- ADD OVERNIGHT FLAG
-- =====================================================

alter table public.shifts
add column is_overnight boolean
not null
default false;

-- =====================================================
-- BACKFILL EXISTING DATA
-- =====================================================

update public.shifts
set is_overnight = (
    end_time < start_time
);

-- =====================================================
-- INDEX (optional)
-- =====================================================

create index idx_shifts_is_overnight
on public.shifts(is_overnight);

comment on column public.shifts.is_overnight is
'True when the shift crosses midnight into the following day.';

commit;