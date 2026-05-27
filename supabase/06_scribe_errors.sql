-- 06_scribe_errors.sql
-- Error log for Workflow #2 (Clinical Scribe) failures.
-- Populated by 02c - Clinical Scribe Error Handler.

CREATE TABLE IF NOT EXISTS scribe_errors (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
  execution_id    TEXT,
  failed_node     TEXT,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scribe_errors_appointment ON scribe_errors(appointment_id);
CREATE INDEX IF NOT EXISTS idx_scribe_errors_created_at  ON scribe_errors(created_at DESC);

ALTER TABLE scribe_errors ENABLE ROW LEVEL SECURITY;

-- Service role (n8n) bypasses RLS. Practitioners read their own via appointment join.
CREATE POLICY "practitioners read own scribe errors"
  ON scribe_errors FOR SELECT
  USING (
    appointment_id IN (
      SELECT a.id FROM appointments a
      JOIN practitioners p ON p.id = a.practitioner_id
      WHERE p.user_id = auth.uid()
    )
  );
