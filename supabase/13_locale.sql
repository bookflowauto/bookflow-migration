-- =============================================================================
-- Practitioner UI locale preference
-- Default 'el' (Greek) to match target market.
-- =============================================================================

ALTER TABLE public.practitioners
    ADD COLUMN IF NOT EXISTS locale TEXT NOT NULL DEFAULT 'el'
    CHECK (locale IN ('en', 'el'));

COMMENT ON COLUMN public.practitioners.locale IS
    'UI language preference for the dashboard. en = English, el = Greek.';
