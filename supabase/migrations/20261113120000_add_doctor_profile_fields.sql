ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS specialty TEXT,
  ADD COLUMN IF NOT EXISTS rqe TEXT CHECK (rqe IS NULL OR rqe ~ '^[0-9]+$');
