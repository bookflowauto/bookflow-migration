# Bookflow Setup Guide

---

## STEP 1 — Run Schema in Supabase SQL Editor

### 1.1 Open SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your Bookflow project
3. Left sidebar → **SQL Editor** → **New query**

### 1.2 Run the schema
1. Open `supabase/01_schema.sql` from this repo
2. Copy the entire contents → paste into the SQL Editor
3. Click **Run** (or `Ctrl+Enter`)
4. Confirm you see: `Success. No rows returned` (that's correct — DDL has no output)

### 1.3 Verify tables were created
Run this check query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
Expected output:
```
appointments
patients
practitioners
sms_log
```

Also verify the views:
```sql
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public';
```
Expected:
```
v_appointment_full
v_patient_notes
```

### 1.4 Run RLS policies
1. Open a **new query** tab in the SQL Editor
2. Copy contents of `supabase/02_rls.sql` → paste → **Run**
3. Verify with:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```
All four tables should show `rowsecurity = true`.

### 1.5 Optional: run seed data (test only)
Only if you want a test practitioner and patient:
```sql
-- contents of supabase/03_seed.sql
```
Skip this in production.

---

## STEP 2 — Add Supabase Credentials to n8n

### 2.1 Get your Supabase keys
1. Supabase Dashboard → your project → **Project Settings** (gear icon) → **API**
2. Copy two values:
   - **Project URL** — looks like `https://abcdefghijkl.supabase.co`
   - **service_role secret** — under "Project API keys", the `service_role` row (click reveal)
   > ⚠️ Never use the `anon` key in n8n. Always `service_role`.

### 2.2 Create the credential in n8n
1. Open n8n at https://n8n.bookflow.uk
2. Top-right menu → **Credentials** → **Add credential**
3. Search for: `Header Auth`
4. Fill in:
   - **Name:** `Supabase Service Role`
   - **Name (header field):** `apikey`
   - **Value:** paste your `service_role` key
5. Click **Save**

### 2.3 Add a second header credential for Authorization
n8n Header Auth only supports one header per credential. Handle the `Authorization` header inside each HTTP Request node directly:

In any Supabase HTTP Request node, under **Headers**, add:
| Name | Value |
|---|---|
| `apikey` | *(use credential)* |
| `Authorization` | `Bearer YOUR_SERVICE_ROLE_KEY` |
| `Content-Type` | `application/json` |

> Tip: store the service_role key as an n8n **Variable** (Settings → Variables → `SUPABASE_KEY`) so you reference `{{ $vars.SUPABASE_KEY }}` instead of pasting it everywhere.

### 2.4 Set the Supabase base URL as a variable
1. n8n → Settings → **Variables** → Add:
   - `SUPABASE_URL` = `https://abcdefghijkl.supabase.co`
   - `SUPABASE_KEY` = your service_role key
2. Reference in nodes as `{{ $vars.SUPABASE_URL }}` and `{{ $vars.SUPABASE_KEY }}`

---

## STEP 3 — Workflow #1: Practitioner Sync

**Flow:** Google Calendar event → check if patient exists → upsert appointment → send Infobip SMS

### 3.1 Create the workflow
1. n8n → **Workflows** → **New workflow**
2. Name it: `01 - Practitioner Sync`

### 3.2 Node 1 — Google Calendar Trigger
- Node type: **Google Calendar Trigger**
- Credential: your Google OAuth 2.0 credential
- **Calendar:** select the practitioner's calendar (or use `primary`)
- **Trigger on:** `Event Created or Updated`
- **Options → Fields to return:** `id, summary, start, end, attendees, organizer`

Output you'll use downstream:
- `{{ $json.id }}` → google_event_id
- `{{ $json.summary }}` → appointment summary
- `{{ $json.start.dateTime }}` → appointment_time
- `{{ $json.organizer.email }}` → to look up practitioner

### 3.3 Node 2 — Lookup Practitioner
- Node type: **HTTP Request**
- Method: `GET`
- URL: `{{ $vars.SUPABASE_URL }}/rest/v1/practitioners?calendar_id=eq.{{ $json.organizer.email }}&select=id,name,phone`
- Headers: (as per Step 2.3)

Add an **If** node after this:
- Condition: `{{ $json[0].id }}` is not empty
- **True** → continue
- **False** → stop (no practitioner found for this calendar)

### 3.4 Node 3 — Upsert Appointment
- Node type: **HTTP Request**
- Method: `POST`
- URL: `{{ $vars.SUPABASE_URL }}/rest/v1/appointments?on_conflict=google_event_id`
- Headers:
  - `apikey`: `{{ $vars.SUPABASE_KEY }}`
  - `Authorization`: `Bearer {{ $vars.SUPABASE_KEY }}`
  - `Content-Type`: `application/json`
  - `Prefer`: `resolution=merge-duplicates,return=representation`
- Body (JSON):
```json
{
  "google_event_id": "{{ $('Google Calendar Trigger').item.json.id }}",
  "practitioner_id": "{{ $('Lookup Practitioner').item.json[0].id }}",
  "appointment_time": "{{ $('Google Calendar Trigger').item.json.start.dateTime }}",
  "summary": "{{ $('Google Calendar Trigger').item.json.summary }}",
  "status": "scheduled"
}
```

### 3.5 Node 4 — Lookup Patient (optional, if attendees present)
- Method: `GET`
- URL: `{{ $vars.SUPABASE_URL }}/rest/v1/patients?phone=eq.{{ $json.attendeePhone }}&select=id,name,phone`
- If found, do a second PATCH to link `patient_id` on the appointment.

### 3.6 Node 5 — Send Infobip SMS
- Node type: **HTTP Request**
- Method: `POST`
- URL: `https://api.infobip.com/sms/2/text/advanced`
- Headers:
  - `Authorization`: `App YOUR_INFOBIP_API_KEY`
  - `Content-Type`: `application/json`
- Body:
```json
{
  "messages": [
    {
      "from": "Bookflow",
      "destinations": [{ "to": "{{ $('Lookup Practitioner').item.json[0].phone }}" }],
      "text": "Reminder: You have an appointment — {{ $('Google Calendar Trigger').item.json.summary }} at {{ $('Google Calendar Trigger').item.json.start.dateTime }}"
    }
  ]
}
```

### 3.7 Node 6 — Log SMS
- Method: `POST`
- URL: `{{ $vars.SUPABASE_URL }}/rest/v1/sms_log`
- Body:
```json
{
  "appointment_id": "{{ $('Upsert Appointment').item.json[0].id }}",
  "phone": "{{ $('Lookup Practitioner').item.json[0].phone }}",
  "message_body": "Reminder sent",
  "status": "sent"
}
```

### 3.8 Activate the workflow
Toggle **Active** in the top-right of the workflow editor.

---

## STEP 4 — Merger Logic Query (v_patient_notes → GPT-4o)

This is the query used inside Workflow #2 (Clinical Scribe) to pull all past notes for a patient before generating the merged SOAP.

### 4.1 The n8n Postgres node query
Use a **Postgres** node (connecting directly to Supabase via the connection string, or via HTTP to the view):

**Option A — HTTP Request to view (recommended, no extra credential)**
- Method: `GET`
- URL:
```
{{ $vars.SUPABASE_URL }}/rest/v1/v_patient_notes?patient_id=eq.{{ $json.patient_id }}&select=appointment_time,clinical_note&order=appointment_time.asc
```

**Option B — Direct SQL via Supabase RPC**
Create this function in Supabase SQL Editor first:
```sql
CREATE OR REPLACE FUNCTION public.get_patient_notes(p_patient_id UUID)
RETURNS TABLE(appointment_time TIMESTAMPTZ, clinical_note TEXT)
LANGUAGE sql STABLE AS $$
  SELECT appointment_time, clinical_note
  FROM public.v_patient_notes
  WHERE patient_id = p_patient_id
  ORDER BY appointment_time ASC;
$$;
```
Then call it from n8n:
- POST to `{{ $vars.SUPABASE_URL }}/rest/v1/rpc/get_patient_notes`
- Body: `{ "p_patient_id": "{{ $json.patient_id }}" }`

### 4.2 Build the merged prompt in n8n Code node
After fetching notes, add a **Code** node:
```javascript
const notes = $input.all();

const noteBlock = notes.map((n, i) => {
  const date = new Date(n.json.appointment_time).toLocaleDateString('el-GR');
  return `Συνεδρία ${i + 1} (${date}):\n${n.json.clinical_note}`;
}).join('\n\n---\n\n');

return [{
  json: {
    merged_prompt: `Είσαι κλινικός ψυχολόγος γραμματέας. Βάσει των παρακάτω σημειώσεων SOAP από όλες τις συνεδρίες του ασθενή, δημιούργησε μία ενοποιημένη περίληψη SOAP στα Ελληνικά. Επικεντρώσου μόνο στα αντικειμενικά και υποκειμενικά γεγονότα.\n\n${noteBlock}`
  }
}];
```

### 4.3 Pass to GPT-4o node
- Node type: **OpenAI** (or HTTP Request to OpenAI API)
- Model: `gpt-4o`
- System prompt: *(leave blank — prompt is self-contained above)*
- User message: `{{ $json.merged_prompt }}`

### 4.4 Write merged summary back to patient
- Method: `PATCH`
- URL: `{{ $vars.SUPABASE_URL }}/rest/v1/patients?id=eq.{{ $json.patient_id }}`
- Header: `Prefer: return=minimal`
- Body:
```json
{
  "merged_clinical_summary": "{{ $json.choices[0].message.content }}"
}
```

---

## Quick Reference — Supabase REST Patterns

| Action | Method | URL pattern | Extra header |
|---|---|---|---|
| Select all | GET | `/rest/v1/table?select=*` | — |
| Filter | GET | `/rest/v1/table?col=eq.value` | — |
| Insert | POST | `/rest/v1/table` | `Prefer: return=representation` |
| Upsert | POST | `/rest/v1/table?on_conflict=col` | `Prefer: resolution=merge-duplicates,return=representation` |
| Update | PATCH | `/rest/v1/table?id=eq.uuid` | `Prefer: return=minimal` |
| Delete | DELETE | `/rest/v1/table?id=eq.uuid` | — |
