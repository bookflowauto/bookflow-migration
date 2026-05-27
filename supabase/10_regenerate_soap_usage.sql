-- 10_regenerate_soap_usage.sql
-- Adds monthly regenerate SOAP quota tracking to practitioners table.
-- Limits by plan tier: essentials (25), professional (60), premium (unlimited).

ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS regenerate_soap_count INTEGER DEFAULT 0;
ALTER TABLE practitioners ADD COLUMN IF NOT EXISTS regenerate_soap_reset_date DATE DEFAULT CURRENT_DATE;

-- Lazy reset: checked in API endpoint before quota validation.
-- When practitioner calls /api/regenerate-soap, endpoint checks if reset_date < today's month,
-- and if so, resets count to 0 and updates reset_date to first of current month.
