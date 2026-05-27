-- =============================================================================
-- Migration 15: Practitioner notification preferences
-- =============================================================================
-- Adds opt-in/opt-out toggles for SMS reminders and email digest, plus the
-- reminder offset (hours before appointment to send SMS). Read by Workflow #1
-- (Practitioner Sync) before queuing reminder SMS.
--
-- Defaults preserve current behaviour: SMS reminders ON, 24h offset, no email
-- digest. Existing rows backfilled by the DEFAULT clauses on ALTER TABLE.
-- =============================================================================

ALTER TABLE public.practitioners
    ADD COLUMN IF NOT EXISTS sms_reminder_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
    ADD COLUMN IF NOT EXISTS reminder_offset_hours INT     NOT NULL DEFAULT 24,
    ADD COLUMN IF NOT EXISTS email_digest_enabled  BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.practitioners
    ADD CONSTRAINT practitioners_reminder_offset_hours_range
        CHECK (reminder_offset_hours BETWEEN 1 AND 168);

COMMENT ON COLUMN public.practitioners.sms_reminder_enabled
    IS 'When false, Workflow #1 skips SMS reminders for this practitioner''s appointments.';
COMMENT ON COLUMN public.practitioners.reminder_offset_hours
    IS 'Hours before appointment_time to send reminder SMS. Range 1-168 (7 days).';
COMMENT ON COLUMN public.practitioners.email_digest_enabled
    IS 'When true, practitioner receives daily email digest of upcoming appointments.';
