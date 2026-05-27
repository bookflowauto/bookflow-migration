-- 07_add_audio_duration.sql
-- Add audio duration tracking for scribe usage metering.

ALTER TABLE appointments
ADD COLUMN audio_duration_seconds INTEGER;

CREATE INDEX IF NOT EXISTS idx_appointments_audio_duration
ON appointments(audio_duration_seconds) WHERE audio_duration_seconds IS NOT NULL;
