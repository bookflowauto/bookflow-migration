-- 09_usage_metering_view.sql
-- Monthly usage aggregation per practitioner for quota enforcement.

CREATE OR REPLACE VIEW v_practitioner_usage_monthly AS
SELECT
  p.id AS practitioner_id,
  p.name AS practitioner_name,
  DATE_TRUNC('month', COALESCE(sl.sent_at, a.updated_at))::DATE AS period_start,
  COALESCE(
    COUNT(DISTINCT CASE WHEN sl.status = 'sent' THEN sl.id END),
    0
  ) AS sms_sent_count,
  COALESCE(
    ROUND(
      SUM(
        CASE
          WHEN a.scribe_status = 'complete' AND a.audio_duration_seconds IS NOT NULL
          THEN a.audio_duration_seconds / 60.0
          ELSE 0
        END
      )::NUMERIC,
      2
    ),
    0
  ) AS scribe_minutes_used
FROM practitioners p
LEFT JOIN sms_log sl ON sl.appointment_id IN (
  SELECT id FROM appointments WHERE practitioner_id = p.id
)
LEFT JOIN appointments a ON a.practitioner_id = p.id
WHERE p.status = 'active'
GROUP BY
  p.id,
  p.name,
  DATE_TRUNC('month', COALESCE(sl.sent_at, a.updated_at))
ORDER BY p.id, period_start DESC;

-- Materialized view option (faster for frequent queries, requires refresh):
-- CREATE MATERIALIZED VIEW v_practitioner_usage_monthly AS ...
-- Refresh: REFRESH MATERIALIZED VIEW v_practitioner_usage_monthly;
