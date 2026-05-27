# Workflow #5: Receipt Submission to myDATA — Build Instructions

This workflow receives a `POST /webhook/receipt-submit` from the dashboard, builds an AADE-compliant **XML** `InvoicesDoc` envelope, submits it to the AADE myDATA `SendInvoices` endpoint, parses the XML response, and writes the resulting MARK / failure state back to the appointment plus the `mydata_audit_log` table.

The fastest path is to **import `n8n-workflows/05-receipt-submission/workflow.json`** in the n8n UI (Workflows → ⋯ → Import from File), then edit each Supabase HTTP node to attach your **`Supabase Bookflow (Service Role)`** credential. The steps below describe the same workflow node-by-node for anyone building it by hand or auditing the imported version.

---

## Contract

**Inbound webhook payload** (sent by `dashboard/app/api/appointments/[id]/issue-receipt/route.ts`):

```json
{
  "appointmentId": "uuid",
  "practitionerId": "uuid",
  "patientId": "uuid",
  "appointmentTime": "2026-05-24T10:00:00Z",
  "amount": 50
}
```

**Env var on the dashboard** (already wired in the route):

```
N8N_RECEIPT_WEBHOOK_URL=https://n8n.bookflow.uk/webhook/receipt-submit
```

**AADE endpoints**

| Environment | URL |
|---|---|
| Sandbox | `https://mydataapidev.aade.gr/SendInvoices` |
| Production | `https://mydatapi.aade.gr/myDATA/SendInvoices` |

Selected per practitioner via `practitioners.mydata_environment`.

**AADE headers**

- `aade-user-id`: practitioner's myDATA username
- `Ocp-Apim-Subscription-Key`: decrypted from Supabase Vault via `get_mydata_subscription_key(p_practitioner_id)`
- `Content-Type: application/xml`

---

## Node-by-node

### 1. Webhook Trigger
- Method: `POST`
- Path: `receipt-submit`
- Response mode: **Using 'Respond to Webhook' node**

### 2. Get Appointment Context (HTTP Request, Supabase)
- Method: `GET`
- URL: `https://dgnkvrjwfbdsdcuxsruk.supabase.co/rest/v1/appointments`
- Query parameters:
  - `id` = `=eq.{{ $json.body.appointmentId }}`
  - `select` = `id,appointment_time,status,patient_id,practitioner_id,practitioners(name,vat_number,mydata_username,mydata_environment,rate_per_session_eur,kad_code,business_address,vat_regime),patients(name,patient_ref)`
- Headers: `Accept: application/vnd.pgrst.object+json` (forces PostgREST to return a single object instead of an array — simplifies downstream expressions)
- Credential: `Supabase Bookflow (Service Role)` (predefined type `supabaseApi`)

### 3. Decrypt Subscription Key (HTTP Request, Supabase RPC)
- Method: `POST`
- URL: `https://dgnkvrjwfbdsdcuxsruk.supabase.co/rest/v1/rpc/get_mydata_subscription_key`
- Body (JSON):
  ```json
  { "p_practitioner_id": "{{ $('Webhook Trigger').first().json.body.practitionerId }}" }
  ```
- Credential: same Supabase service-role.
- Response: a single JSON string (`$json` after this node is the plaintext key, or `null`).

### 4. Has Subscription Key? (IF)
- Condition: `{{ $json }}` is **not empty** (string).
- **True** branch → continue to *Build Receipt XML*.
- **False** branch → *Mark Failed (No Key)* → *Respond 400 No Key*. This stops practitioners who never finished myDATA onboarding from punching a hole into AADE.

### 5. Build Receipt XML (Code)
Generates the `InvoicesDoc` XML. Key decisions baked in:
- `invoiceType = 11.2` — **Απόδειξη Παροχής Υπηρεσιών** (retail receipt for services, the right type for B2C clinical psychology).
- `vatCategory = 7`, `vatExemptionCategory = 4` — **VAT-exempt under Article 22 of the Greek VAT Code** (medical/clinical psychology).
- `incomeClassification = E3_561_003 / category1_3` — retail services to private clients.
- `paymentMethods.type = 3` — cash (the safest default; revisit when bank/card flows are added).
- `series = 'A'`, `aa = floor(Date.now()/1000)` — guarantees uniqueness without a DB sequence. Swap for a per-practitioner sequence later if the accountant complains about gaps.
- Throws (and the workflow surfaces as a failed execution) if `amount <= 0` or `vat_number` is missing on the practitioner row.

Returns `{ xml, series, aa, amount }` so the audit log can record what we sent without re-parsing the XML.

### 6. Submit to AADE (HTTP Request)
- Method: `POST`
- URL (expression):
  ```
  ={{ $('Get Appointment Context').first().json.practitioners.mydata_environment === 'production' ? 'https://mydatapi.aade.gr/myDATA/SendInvoices' : 'https://mydataapidev.aade.gr/SendInvoices' }}
  ```
- Body content type: **Raw** → `application/xml` → `={{ $json.xml }}`
- Headers:
  - `Content-Type: application/xml`
  - `Accept: application/xml`
  - `aade-user-id: {{ $('Get Appointment Context').first().json.practitioners.mydata_username }}`
  - `Ocp-Apim-Subscription-Key: {{ $('Decrypt Subscription Key').first().json }}`
- Options:
  - Timeout: **30000 ms**
  - Response format: **Text** (so we get the raw XML body)
  - **Never Error: ON** — we want to inspect non-2xx responses in the parsing step rather than throw.

### 7. Parse AADE Response (XML node)
- Mode: **XML → JSON**
- Data property: `data`
- Options: `explicitArray=false`, `ignoreAttrs=true`, `trim=true`

### 8. Extract Result (Code)
Normalizes the parsed `ResponseDoc` into a flat object: `{ ok, statusCode, invoiceMark, invoiceUid, errorMessage, rawResponse }`. The success signal is per-row `<statusCode>Success</statusCode>` **and** a non-empty `<invoiceMark>`. Multiple `<error>` rows are joined into a single `errorMessage` for the audit log.

### 9. Was Submission OK? (IF)
- Condition: `{{ $json.ok }}` is **true**.

### 10a. Update Appointment (Success) → 11a. Log Success to Audit → 12a. Respond 200 OK
- PATCH `appointments?id=eq.{appointmentId}` with:
  ```json
  {
    "mydata_status": "submitted",
    "mydata_mark": "{{ $('Extract Result').first().json.invoiceMark }}",
    "mydata_invoice_uid": "{{ $('Extract Result').first().json.invoiceUid }}",
    "mydata_submitted_at": "{{ $now.toISO() }}"
  }
  ```
- POST `mydata_audit_log` with `action='submit_receipt'`, the AADE mark, the environment, and `request_summary={series, aa, amount}` (never the subscription key).
- Respond `200 { ok: true, mark, uid }`.

### 10b. Update Appointment (Failure) → 11b. Log Failure to Audit → 12b. Respond 500 Error
- PATCH `mydata_status = 'failed'`.
- POST `mydata_audit_log` with `error_message` from the extractor.
- Respond `500 { ok: false, error }`. The dashboard already keeps the appointment in `pending` → `failed` state and surfaces the "Retry" button.

---

## Test plan

1. **Pre-flight (Supabase SQL Editor):** make sure your test practitioner has `mydata_credentials_verified = true`, a `vat_number`, and a secret in `vault.secrets`. Smoke-test the RPC:
   ```sql
   SELECT get_mydata_subscription_key('<practitioner-uuid>');
   ```
   Expect a non-null string.

2. **Webhook URL:** after importing the workflow and clicking **Save** + **Activate**, copy the production webhook URL from the Webhook node and confirm it matches `N8N_RECEIPT_WEBHOOK_URL` in the dashboard `.env`. If you used the **Test URL** during development, the `?test` suffix won't fire while the workflow is inactive — switch to the production URL for the end-to-end run.

3. **Sandbox end-to-end:**
   - In the dashboard, open a confirmed test appointment → **Issue receipt** → enter €50 → submit.
   - Watch n8n **Executions**. Expect every node green; the AADE node body should contain `<invoiceMark>...</invoiceMark>`.
   - Refresh the appointment page: the receipt badge should switch to **Issued** and show the MARK.
   - Verify the audit row: `SELECT action, response_status, aade_mark, error_message FROM mydata_audit_log ORDER BY created_at DESC LIMIT 1;`

4. **Failure paths to exercise:**
   - Practitioner with no subscription key → expect `400 No Key` and `mydata_status='failed'`.
   - Deliberately wrong `mydata_username` → expect `Submit to AADE` to return a non-2xx body that the extractor surfaces as `errorMessage`, and the audit row should capture the AADE error code.
   - `amount = 0` (forced via curl) → `Build Receipt XML` throws and the execution shows the error.

---

## Production switch-over

- Practitioner sets `mydata_environment = 'production'` in Settings → myDATA (after AADE issues production credentials).
- No workflow changes required; the URL expression in **Submit to AADE** branches automatically.
- **AADE 24-hour transmission deadline still applies** — if a submission fails, the dashboard's retry button must be clicked (or a future scheduled retry workflow built) inside that window or the receipt is late and the practitioner is exposed to a €150+ penalty per receipt.

---

## Known gaps (not blockers for first launch)

- **No automatic retry** on transient AADE 5xx / network errors. Today the dashboard surfaces a manual "Retry" button. Add a scheduled n8n trigger that re-runs failed submissions within the 24h window if/when this becomes painful.
- **Series/AA numbering is timestamp-derived** — guarantees uniqueness but not human-friendly gap-free numbering. Per-practitioner sequence in Postgres is a 10-line change when the first accountant asks.
- **`paymentMethods.type` hardcoded to 3 (cash)**. Card/IRIS/bank-transfer support needs a column on appointments or a per-receipt selector in the UI.
- **Mixed-VAT regime not implemented.** All receipts go out as VAT-exempt Article 22. The schema has `vat_regime`/`has_taxable_secondary_activity` columns ready; a future branch in *Build Receipt XML* will need to pick `vatCategory` based on those flags.
