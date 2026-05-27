-- =============================================================================
-- SEED DATA — for local testing only, do NOT run in production
-- =============================================================================

INSERT INTO public.practitioners (name, calendar_id, email, phone, status, setup_fee_paid)
VALUES
    ('Dr. Demo Practitioner', 'demo@group.calendar.google.com', 'demo@bookflow.uk', '+447700000000', 'active', true);

-- Patient will auto-assign patient_ref = PT-0001
INSERT INTO public.patients (name, email, phone, intake_status)
VALUES
    ('Demo Patient', 'patient@example.com', '+447700000001', 'pending');
