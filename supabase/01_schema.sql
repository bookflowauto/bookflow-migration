-- =============================================================================
-- BOOKFLOW SUPABASE SCHEMA
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New Query)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- ENUM TYPES
-- =============================================================================

CREATE TYPE practitioner_status AS ENUM ('active', 'inactive');
CREATE TYPE intake_status       AS ENUM ('pending', 'completed');
CREATE TYPE scribe_status       AS ENUM ('pending', 'transcribing', 'complete', 'failed');
CREATE TYPE appointment_status  AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled');

-- =============================================================================
-- TABLE: practitioners
-- Links to Supabase Auth via user_id — one auth account per practitioner
-- =============================================================================

CREATE TABLE public.practitioners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
    name            TEXT        NOT NULL,
    calendar_id     TEXT        NOT NULL UNIQUE,
    email           TEXT        UNIQUE,
    phone           TEXT,
    status          practitioner_status NOT NULL DEFAULT 'active',
    setup_fee_paid  BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- TABLE: patients
-- =============================================================================

CREATE TABLE public.patients (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_ref             TEXT UNIQUE,
    name                    TEXT        NOT NULL,
    email                   TEXT,
    phone                   TEXT,
    date_of_birth           DATE,
    intake_status           intake_status NOT NULL DEFAULT 'pending',
    intake_form_link        TEXT,
    total_sessions          INTEGER     NOT NULL DEFAULT 0,
    merged_clinical_summary TEXT,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.patients.patient_ref            IS 'Human-readable ID (PT-0001) used in SMS links and Fillout URLs';
COMMENT ON COLUMN public.patients.merged_clinical_summary IS 'GPT-4o merged SOAP note in Greek across all sessions';

-- =============================================================================
-- TABLE: appointments
-- =============================================================================

CREATE TABLE public.appointments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    google_event_id     TEXT        NOT NULL UNIQUE,
    practitioner_id     UUID        NOT NULL REFERENCES public.practitioners(id) ON DELETE RESTRICT,
    patient_id          UUID        REFERENCES public.patients(id) ON DELETE SET NULL,
    appointment_time    TIMESTAMPTZ NOT NULL,
    summary             TEXT,
    status              appointment_status NOT NULL DEFAULT 'scheduled',
    fillout_link        TEXT,
    audio_file_url      TEXT,
    raw_transcript      TEXT,
    scribe_status       scribe_status NOT NULL DEFAULT 'pending',
    scribe_started_at   TIMESTAMPTZ,
    scribe_completed_at TIMESTAMPTZ,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN public.appointments.google_event_id IS 'Upsert key — prevents duplicates when GCal fires multiple times';
COMMENT ON COLUMN public.appointments.raw_transcript  IS 'Verbatim Whisper transcription of practitioner session recording';

-- =============================================================================
-- TABLE: sms_log
-- =============================================================================

CREATE TABLE public.sms_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id  UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    patient_id      UUID REFERENCES public.patients(id)    ON DELETE SET NULL,
    phone           TEXT NOT NULL,
    message_body    TEXT NOT NULL,
    infobip_msg_id  TEXT,
    status          TEXT,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_practitioners_updated_at
    BEFORE UPDATE ON public.practitioners
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_appointments_updated_at
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- AUTO patient_ref (PT-0001, PT-0002...)
-- =============================================================================

CREATE SEQUENCE IF NOT EXISTS patient_ref_seq START 1;

CREATE OR REPLACE FUNCTION public.set_patient_ref()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.patient_ref IS NULL THEN
        NEW.patient_ref := 'PT-' || LPAD(nextval('patient_ref_seq')::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_patients_ref
    BEFORE INSERT ON public.patients
    FOR EACH ROW EXECUTE FUNCTION public.set_patient_ref();

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_appointments_practitioner  ON public.appointments(practitioner_id);
CREATE INDEX idx_appointments_patient       ON public.appointments(patient_id);
CREATE INDEX idx_appointments_time          ON public.appointments(appointment_time DESC);
CREATE INDEX idx_appointments_scribe_status ON public.appointments(scribe_status) WHERE scribe_status != 'complete';
CREATE INDEX idx_sms_log_appointment        ON public.sms_log(appointment_id);

-- =============================================================================
-- VIEWS
-- =============================================================================

CREATE OR REPLACE VIEW public.v_appointment_full AS
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

-- Used by n8n merger logic: all transcripts per patient ordered by date
CREATE OR REPLACE VIEW public.v_patient_transcripts AS
SELECT
    pat.id              AS patient_id,
    pat.patient_ref,
    pat.name            AS patient_name,
    a.id                AS appointment_id,
    a.appointment_time,
    a.raw_transcript,
    a.scribe_status
FROM public.patients pat
JOIN public.appointments a ON a.patient_id = pat.id
WHERE a.raw_transcript IS NOT NULL
ORDER BY pat.id, a.appointment_time ASC;
