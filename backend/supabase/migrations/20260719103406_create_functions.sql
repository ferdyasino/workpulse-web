begin;

-- =====================================================
-- FUNCTION: update_updated_at()
-- Automatically updates updated_at before each row update.
-- =====================================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

commit;