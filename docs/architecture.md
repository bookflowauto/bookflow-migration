# Bookflow Migration — Architecture Reference

## Stack

| Layer | Technology |
|---|---|
| Automation Engine | n8n (self-hosted, Docker) |
| Application DB | Supabase (PostgreSQL 15) |
| n8n Internal DB | Local Postgres 16 (Docker) |
| Calendar Source | Google Calendar API (OAuth 2.0) |
| SMS | Infobip |
| Transcription | OpenAI Whisper |
| Clinical Analysis | OpenAI GPT-4o |
| Forms | Fillout |
| Public Access | Cloudflare Tunnel → n8n.bookflow.uk |

## Supabase Connection from n8n

Use the **service_role** key from Supabase Dashboard → Project Settings → API.
Set as `SUPABASE_SERVICE_KEY` in your n8n credentials (HTTP Header Auth).

Base URL pattern: `https://<project-ref>.supabase.co/rest/v1/<table>`

Required headers on every request:
```
apikey: <service_role_key>
Authorization: Bearer <service_role_key>
Content-Type: application/json
Prefer: return=representation        # for upserts that need the row back
```

## n8n Workflows

| # | Workflow | Trigger | Description |
|---|---|---|---|
| 01 | Practitioner Sync | GCal trigger | Watch calendar → upsert appointment → send SMS reminder |
| 02 | Clinical Scribe | Webhook (audio upload) | Whisper → GPT-4o SOAP → update appointment |
| 03 | Intake Form Processor | Fillout webhook | Link patient → cleanup temp record |
| 04 | Confirmation Click | Webhook (SMS link click) | Update appointment status → return confirmation page |

## Key Design Decisions

- **Scribe Inputs merged into Appointments** — removes a join, simplifies the scribe pipeline.
- **`google_event_id` is the upsert key** — prevents duplicate appointments when GCal fires multiple times for the same event.
- **`patient_ref` auto-increments** (PT-0001, PT-0002…) — used in Fillout links instead of raw UUIDs.
- **`v_patient_notes` view** — n8n fetches all previous SOAP notes for a patient in one query before the GPT-4o merge call.
- **RLS is defence-in-depth** — n8n uses `service_role` (bypasses RLS), but policies protect against anon key leaks.
