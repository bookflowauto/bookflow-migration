-- Migration 16: Add UNIQUE constraint on patients.phone
--
-- Why: Workflow #1 (Practitioner Sync) used a lookup-then-create pattern that
-- silently dropped GCal events whose phone didn't match any patient. The
-- n8n HTTP node drops empty-array responses per-item (alwaysOutputData only
-- emits a placeholder when the entire node produced zero outputs, not when
-- an individual input item's response was empty).
--
-- Fix: rewire Workflow #1 to use a Supabase upsert by phone instead. That
-- requires phone to be UNIQUE. NULL values are allowed (multiple patients
-- without a phone are still permitted by Postgres UNIQUE semantics).
--
-- IMPORTANT: if existing patients share a phone number, this will fail.
-- The DO block below detects + reports duplicates so you can clean them
-- before adding the constraint.

DO $$
DECLARE
  dup_count INT;
BEGIN
  SELECT COUNT(*) INTO dup_count
  FROM (
    SELECT phone FROM patients
    WHERE phone IS NOT NULL
    GROUP BY phone HAVING COUNT(*) > 1
  ) d;

  IF dup_count > 0 THEN
    RAISE EXCEPTION 'Cannot add UNIQUE(phone): % duplicate phone(s) found. Resolve duplicates first.', dup_count;
  END IF;
END $$;

ALTER TABLE patients
  ADD CONSTRAINT patients_phone_unique UNIQUE (phone);
