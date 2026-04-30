-- Add hospital column to surgeries table
ALTER TABLE public.surgeries ADD COLUMN IF NOT EXISTS hospital text;

-- Update the RLS policies (inherits existing policies, no new policy needed)
COMMENT ON COLUMN public.surgeries.hospital IS 'Hospital or clinic where the surgery/procedure was performed';
