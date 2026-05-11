-- Add surgery-level contact phone fields
-- These allow the doctor to specify per-surgery contact numbers (personal and business)
-- that will be displayed to the patient on the doctor contact screen.
-- At least one of the two should be filled at the application level (not enforced at DB level).

ALTER TABLE public.surgeries ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE public.surgeries ADD COLUMN IF NOT EXISTS contact_phone_business TEXT;
