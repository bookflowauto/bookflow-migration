-- 11_mydata.sql
-- myDATA (AADE) integration — Greek tax authority e-receipt issuance.
-- BookFlow operates in ERP mode (Path A): each practitioner is the legal
-- issuer-of-record. We call the myDATA API using their credentials, not ours.
--
-- Credential storage uses Supabase Vault (pgsodium). The subscription key
-- (equivalent to a tax-API password) is stored as a vault secret; we keep
-- only the secret's UUID on the practitioners row. Username is plaintext
-- (same sensitivity class as the practitioner's email).
--
-- Run in Supabase SQL Editor after 10_regenerate_soap_usage.sql.

-- ---------------------------------------------------------------------------
-- 1. Enable Vault (idempotent — Supabase projects have it available)
-- ---------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS supabase_vault CASCADE;

-- ---------------------------------------------------------------------------
-- 2. Enums
-- ---------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE mydata_environment AS ENUM ('sandbox', 'production');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE vat_regime AS ENUM ('exempt', 'standard', 'mixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------------------------------------------------------------------------
-- 3. Columns on practitioners
-- ---------------------------------------------------------------------------

ALTER TABLE practitioners
  -- Billing & rates
  ADD COLUMN IF NOT EXISTS rate_per_session_eur DECIMAL(10, 2)
    NOT NULL DEFAULT 50.00,

  -- myDATA AADE TAXISnet credentials
  ADD COLUMN IF NOT EXISTS mydata_username TEXT,
  ADD COLUMN IF NOT EXISTS mydata_subscription_key_secret_id UUID
    REFERENCES vault.secrets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS mydata_environment mydata_environment
    NOT NULL DEFAULT 'sandbox',
  ADD COLUMN IF NOT EXISTS mydata_credentials_verified BOOLEAN
    NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS mydata_credentials_verified_at TIMESTAMPTZ,

  -- Tax identity (required on every receipt)
  ADD COLUMN IF NOT EXISTS vat_number TEXT,                -- ΑΦΜ, 9 digits
  ADD COLUMN IF NOT EXISTS kad_code TEXT,                  -- e.g. 869039, 869014
  ADD COLUMN IF NOT EXISTS business_address TEXT,
  ADD COLUMN IF NOT EXISTS vat_regime vat_regime NOT NULL DEFAULT 'exempt',
  ADD COLUMN IF NOT EXISTS has_taxable_secondary_activity BOOLEAN
    NOT NULL DEFAULT FALSE;

-- Format constraints (only enforced when value present)
ALTER TABLE practitioners
  DROP CONSTRAINT IF EXISTS practitioners_vat_number_format,
  ADD CONSTRAINT practitioners_vat_number_format
    CHECK (vat_number IS NULL OR vat_number ~ '^[0-9]{9}$');

ALTER TABLE practitioners
  DROP CONSTRAINT IF EXISTS practitioners_kad_code_format,
  ADD CONSTRAINT practitioners_kad_code_format
    CHECK (kad_code IS NULL OR kad_code ~ '^[0-9]{6,8}$');

-- Verified flag implies all required identity fields are present
ALTER TABLE practitioners
  DROP CONSTRAINT IF EXISTS practitioners_mydata_verified_requires_identity,
  ADD CONSTRAINT practitioners_mydata_verified_requires_identity
    CHECK (
      mydata_credentials_verified = FALSE
      OR (
        mydata_username IS NOT NULL
        AND mydata_subscription_key_secret_id IS NOT NULL
        AND vat_number IS NOT NULL
        AND kad_code IS NOT NULL
        AND business_address IS NOT NULL
      )
    );

-- ---------------------------------------------------------------------------
-- 4. Audit log — every myDATA API call (who, when, what, outcome)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mydata_audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  practitioner_id UUID NOT NULL REFERENCES practitioners(id) ON DELETE CASCADE,
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  action          TEXT NOT NULL,        -- 'verify_credentials' | 'submit_receipt' | 'cancel_receipt'
  environment     mydata_environment NOT NULL,
  request_summary JSONB,                -- redacted; never store the subscription key
  response_status INTEGER,              -- HTTP status from AADE
  response_body   JSONB,                -- AADE response (mark_uid, errors, etc.)
  aade_mark       TEXT,                 -- AADE-issued MARK identifier when applicable
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mydata_audit_practitioner
  ON mydata_audit_log(practitioner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mydata_audit_appointment
  ON mydata_audit_log(appointment_id);

-- RLS — practitioner can see their own audit rows; service role bypasses
ALTER TABLE mydata_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS mydata_audit_select_own ON mydata_audit_log;
CREATE POLICY mydata_audit_select_own ON mydata_audit_log
  FOR SELECT
  USING (
    practitioner_id IN (
      SELECT id FROM practitioners WHERE user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 5. Receipt tracking on appointments
-- ---------------------------------------------------------------------------

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS mydata_mark TEXT,              -- AADE MARK once issued
  ADD COLUMN IF NOT EXISTS mydata_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mydata_invoice_uid TEXT,       -- our internal invoice UID
  ADD COLUMN IF NOT EXISTS mydata_status TEXT             -- pending | submitted | failed | cancelled
    DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_mydata_status
  ON appointments(mydata_status)
  WHERE mydata_status IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 6. Helper view — practitioner myDATA config (without exposing secret)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_practitioner_mydata_config AS
SELECT
  p.id                              AS practitioner_id,
  p.user_id,
  p.name,
  p.rate_per_session_eur,
  p.mydata_username,
  p.mydata_environment,
  p.mydata_credentials_verified,
  p.mydata_credentials_verified_at,
  p.vat_number,
  p.kad_code,
  p.business_address,
  p.vat_regime,
  p.has_taxable_secondary_activity,
  (p.mydata_subscription_key_secret_id IS NOT NULL) AS has_subscription_key
FROM practitioners p;

COMMENT ON VIEW v_practitioner_mydata_config IS
  'Practitioner myDATA configuration without exposing the encrypted subscription key. Safe to expose to authenticated users for their own row.';

-- ---------------------------------------------------------------------------
-- 7. SECURITY DEFINER helpers — used by the API to read/write the secret
--    without granting raw vault access to the application role.
-- ---------------------------------------------------------------------------

-- Set or rotate the subscription key for a practitioner.
-- Rotates by overwriting the existing vault row when one is already linked.
CREATE OR REPLACE FUNCTION set_mydata_subscription_key(
  p_practitioner_id UUID,
  p_subscription_key TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_existing_id UUID;
  v_secret_name TEXT := 'mydata_subscription_key_' || p_practitioner_id::text;
BEGIN
  SELECT mydata_subscription_key_secret_id
    INTO v_existing_id
    FROM practitioners
   WHERE id = p_practitioner_id;

  IF v_existing_id IS NOT NULL THEN
    PERFORM vault.update_secret(v_existing_id, p_subscription_key);
    RETURN v_existing_id;
  ELSE
    v_existing_id := vault.create_secret(p_subscription_key, v_secret_name, 'myDATA AADE subscription key');
    UPDATE practitioners
       SET mydata_subscription_key_secret_id = v_existing_id
     WHERE id = p_practitioner_id;
    RETURN v_existing_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION set_mydata_subscription_key(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION set_mydata_subscription_key(UUID, TEXT) TO service_role;

-- Fetch the decrypted subscription key. Service-role-only by design — never
-- expose this to anon or authenticated; it returns plaintext credentials.
CREATE OR REPLACE FUNCTION get_mydata_subscription_key(p_practitioner_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id UUID;
  v_plaintext TEXT;
BEGIN
  SELECT mydata_subscription_key_secret_id
    INTO v_secret_id
    FROM practitioners
   WHERE id = p_practitioner_id;

  IF v_secret_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT decrypted_secret
    INTO v_plaintext
    FROM vault.decrypted_secrets
   WHERE id = v_secret_id;

  RETURN v_plaintext;
END;
$$;

REVOKE ALL ON FUNCTION get_mydata_subscription_key(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_mydata_subscription_key(UUID) TO service_role;
