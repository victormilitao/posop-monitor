-- Add doctor_orientations table for custom doctor notes per surgery
CREATE TABLE IF NOT EXISTS public.doctor_orientations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    surgery_id UUID NOT NULL REFERENCES public.surgeries(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT NOT NULL CHECK (char_length(content) <= 300),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_orientations ENABLE ROW LEVEL SECURITY;

-- Doctors can insert orientations for their own surgeries
CREATE POLICY "Doctors can insert own orientations"
    ON public.doctor_orientations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        doctor_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.surgeries s
            WHERE s.id = surgery_id AND s.doctor_id = auth.uid()
        )
    );

-- Doctors can view orientations for their own surgeries
CREATE POLICY "Doctors can view own orientations"
    ON public.doctor_orientations
    FOR SELECT
    TO authenticated
    USING (
        doctor_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.patients p
            WHERE p.id = auth.uid()
            AND EXISTS (
                SELECT 1 FROM public.surgeries s
                WHERE s.id = surgery_id AND s.patient_id = p.id
            )
        )
    );

-- Doctors can update their own orientations
CREATE POLICY "Doctors can update own orientations"
    ON public.doctor_orientations
    FOR UPDATE
    TO authenticated
    USING (doctor_id = auth.uid())
    WITH CHECK (doctor_id = auth.uid());

-- Doctors can delete their own orientations
CREATE POLICY "Doctors can delete own orientations"
    ON public.doctor_orientations
    FOR DELETE
    TO authenticated
    USING (doctor_id = auth.uid());

-- Index for fast lookups by surgery
CREATE INDEX IF NOT EXISTS idx_doctor_orientations_surgery_id
    ON public.doctor_orientations(surgery_id);
