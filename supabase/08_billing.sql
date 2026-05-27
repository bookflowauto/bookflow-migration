-- 08_billing.sql
-- Add subscription and billing fields to practitioners table.
-- Foundation for plan-based feature gating and quota enforcement.

-- Enums
CREATE TYPE plan_tier AS ENUM ('essentials', 'professional', 'premium');
CREATE TYPE billing_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');

-- Add columns to practitioners
ALTER TABLE practitioners
ADD COLUMN plan_tier plan_tier DEFAULT 'essentials',
ADD COLUMN billing_status billing_status DEFAULT 'trial',
ADD COLUMN trial_ends_at TIMESTAMPTZ,
ADD COLUMN current_period_start TIMESTAMPTZ,
ADD COLUMN current_period_end TIMESTAMPTZ,
ADD COLUMN stripe_customer_id TEXT UNIQUE,
ADD COLUMN stripe_subscription_id TEXT UNIQUE,
ADD COLUMN billing_email TEXT;

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_practitioners_plan_tier ON practitioners(plan_tier);
CREATE INDEX IF NOT EXISTS idx_practitioners_billing_status ON practitioners(billing_status);
CREATE INDEX IF NOT EXISTS idx_practitioners_trial_ends_at ON practitioners(trial_ends_at);
CREATE INDEX IF NOT EXISTS idx_practitioners_stripe_customer ON practitioners(stripe_customer_id);

-- Note: constraint for trial email is enforced at application level, not DB level,
-- to allow existing practitioners to migrate without billing_email initially.
