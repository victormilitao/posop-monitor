-- Create doctor_orientations table
-- Allows doctors to add free-text orientations/instructions for specific surgeries
-- Patients can view orientations linked to their own surgeries

CREATE TABLE IF NOT EXISTS public.doctor_orientations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.doctor_orientations ENABLE ROW LEVEL SECURITY;

-- Policy: doctors can manage orientations for their own surgeries
CREATE POLICY "Doctors can manage their orientations"
    ON public.doctor_orientations
    FOR ALL
    USING (
        doctor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.surgeries s
            WHERE s.id = surgery_id AND s.patient_id = auth.uid()
        )
    );

-- Policy: patients can read orientations for their surgeries
CREATE POLICY "Patients can read their orientations"
    ON public.doctor_orientations
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.surgeries s
            WHERE s.id = surgery_id AND s.patient_id = auth.uid()
        )
    );
