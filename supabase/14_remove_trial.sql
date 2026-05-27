-- 14_remove_trial.sql
-- Remove the free-trial concept. New practitioners are locked into the billing
-- page until they pick a paid plan.
--
-- Decisions (session 11):
--   * No free trial. New practitioners default to billing_status='unpaid'.
--   * Every /dashboard/* route except /dashboard/billing redirects to billing
--     while billing_status is not 'active'.
--   * Stripe webhook flips status to 'active' on subscription.created.
--
-- Postgres enums cannot easily DROP a value, so the legacy 'trial' value stays
-- in the type for safety. The default and existing rows are migrated to
-- 'unpaid'. UI code no longer renders trial-specific copy.
--
-- NOTE: In Supabase SQL editor, run steps 1–2 together, then step 3 in a
--       separate query batch. ALTER TYPE ADD VALUE must commit before the
--       new value can be used in DML statements in the same transaction.

-- Step 1: Add 'unpaid' to the enum (idempotent in Postgres 15).
-- Run this step alone first, or with step 2 below.
ALTER TYPE billing_status ADD VALUE IF NOT EXISTS 'unpaid' BEFORE 'active';

-- Step 2: Switch the column default to 'unpaid'.
-- Safe to run in the same batch as step 1 (no DML yet).
ALTER TABLE practitioners
  ALTER COLUMN billing_status SET DEFAULT 'unpaid';

-- Step 3: Backfill any practitioner still sitting in 'trial' to 'unpaid'.
-- RUN THIS AS A SEPARATE QUERY in Supabase SQL editor.
-- (Their dashboard will redirect to /billing on next request.)
UPDATE practitioners
SET billing_status = 'unpaid'
WHERE billing_status = 'trial';

-- Step 4: Update the column documentation (optional, run with step 3).
COMMENT ON COLUMN practitioners.billing_status IS
  'unpaid (default, new accounts) | active | past_due | cancelled. trial is legacy and no longer assigned.';
