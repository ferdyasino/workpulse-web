BEGIN;

ALTER TABLE public.user_shifts
DROP COLUMN is_primary;

COMMIT;
