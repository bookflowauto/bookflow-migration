-- Add date_of_birth to patients table
ALTER TABLE public.patients
    ADD COLUMN IF NOT EXISTS date_of_birth DATE;
