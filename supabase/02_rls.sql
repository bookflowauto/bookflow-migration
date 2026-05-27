-- =============================================================================
-- BOOKFLOW ROW-LEVEL SECURITY
-- Run AFTER 01_schema.sql
-- =============================================================================

ALTER TABLE public.practitioners  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_log         ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- HELPER: get the practitioner.id for the currently logged-in auth user
-- =============================================================================

CREATE OR REPLACE FUNCTION public.my_practitioner_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER AS $$
    SELECT id FROM public.practitioners WHERE user_id = auth.uid() LIMIT 1;
$$;

-- =============================================================================
-- practitioners
-- A practitioner can only read/update their own row
-- =============================================================================

CREATE POLICY "practitioners: own row only"
    ON public.practitioners FOR ALL
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- =============================================================================
-- appointments
-- A practitioner can only see appointments assigned to them
-- =============================================================================

CREATE POLICY "appointments: own practitioner only"
    ON public.appointments FOR ALL
    TO authenticated
    USING (practitioner_id = public.my_practitioner_id())
    WITH CHECK (practitioner_id = public.my_practitioner_id());

-- =============================================================================
-- patients
-- A practitioner can only see patients linked via their appointments
-- =============================================================================

CREATE POLICY "patients: linked to own appointments only"
    ON public.patients FOR ALL
    TO authenticated
    USING (
        id IN (
            SELECT patient_id FROM public.appointments
            WHERE practitioner_id = public.my_practitioner_id()
            AND patient_id IS NOT NULL
        )
    )
    WITH CHECK (true);

-- =============================================================================
-- sms_log — read-only for practitioners, write via service_role (n8n) only
-- =============================================================================

CREATE POLICY "sms_log: read own appointment logs"
    ON public.sms_log FOR SELECT
    TO authenticated
    USING (
        appointment_id IN (
            SELECT id FROM public.appointments
            WHERE practitioner_id = public.my_practitioner_id()
        )
    );

-- anon role: zero access (no policies = no access)
