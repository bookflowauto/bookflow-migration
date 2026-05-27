-- 12_mydata_pending_at.sql
-- Adds a timestamp for when an appointment's receipt was flipped to 'pending'.
-- Lets the dashboard auto-recover from stuck 'pending' state if Workflow #5 never
-- responds (timeout, crash, n8n down) by treating pending older than 5 min as 'failed'.

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS mydata_pending_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_appointments_mydata_pending_at
  ON appointments(mydata_pending_at)
  WHERE mydata_status = 'pending';

-- Defensive: ensure rate_per_session_eur exists on practitioners. It was added
-- in 11_mydata.sql, but if that migration was partially applied this prevents
-- the view recreation below from failing.
ALTER TABLE practitioners
  ADD COLUMN IF NOT EXISTS rate_per_session_eur DECIMAL(10, 2) NOT NULL DEFAULT 50.00;

-- Drop and recreate v_appointment_full to surface the new mydata_pending_at column.
-- Using DROP CASCADE to handle any dependent views/functions cleanly.
DROP VIEW IF EXISTS public.v_appointment_full CASCADE;

CREATE VIEW public.v_appointment_full AS
SELECT
    a.id                    AS appointment_id,
    a.google_event_id,
    a.appointment_time,
    a.summary,
    a.status,
    a.scribe_status,
    a.audio_file_url,
    a.raw_transcript,
    a.fillout_link,
    a.mydata_status,
    a.mydata_mark,
    a.mydata_submitted_at,
    a.mydata_invoice_uid,
    a.mydata_pending_at,
    p.id                    AS practitioner_id,
    p.name                  AS practitioner_name,
    p.calendar_id,
    p.phone                 AS practitioner_phone,
    p.rate_per_session_eur,
    pat.id                  AS patient_id,
    pat.patient_ref,
    pat.name                AS patient_name,
    pat.phone               AS patient_phone,
    pat.intake_status,
    pat.merged_clinical_summary
FROM public.appointments a
JOIN public.practitioners p   ON a.practitioner_id = p.id
LEFT JOIN public.patients pat ON a.patient_id      = pat.id;
