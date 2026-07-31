ALTER TABLE public.user_shift_overrides
ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_shift_overrides_updated_at
BEFORE UPDATE ON public.user_shift_overrides
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();