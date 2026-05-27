# Workflow #5: Receipt Submission to myDATA (AADE)

## Overview

**Trigger:** Webhook from `/api/appointments/[id]/issue-receipt` (when practitioner clicks "Issue receipt" button on appointment detail page)

**Purpose:** Generate a Greek tax e-receipt (myDATA format), submit to AADE, and store the issued receipt MARK on the appointment

**Philosophy:** Don't block the appointment confirmation flow. Receipt issuance happens async after the fact, with manual retry if it fails.

---

## Input Payload

The API route calls the n8n webhook with this JSON:

```json
{
  "appointmentId": "uuid",
  "practitionerId": "uuid",
  "patientId": "uuid",
  "appointmentTime": "2026-05-20T14:30:00Z",
  "amount": 50.00
}
```

---

## Workflow Steps (n8n)

### Step 1: Webhook Trigger
- **Node name:** `Webhook (Receipt Issued)`
- **Type:** Webhook
- **Method:** POST
- **URL:** `https://n8n.bookflow.uk/webhook/receipt-submit` (or similar — you choose)
- **Notes:** 
  - This is the webhook URL you'll set in `N8N_RECEIPT_WEBHOOK_URL` env var on dashboard

### Step 2: Get Appointment Details
- **Node name:** `Get Appointment`
- **Type:** Supabase / HTTP
- **Credentials:** Supabase service role (existing)
- **Query:**
  ```
  SELECT 
    a.*,
    p.name as practitioner_name,
    p.vat_number,
    p.rate_per_session_eur,
    pat.name as patient_name,
    pat.patient_ref
  FROM appointments a
  JOIN practitioners p ON a.practitioner_id = p.id
  LEFT JOIN patients pat ON a.patient_id = pat.id
  WHERE a.id = '{{ $json.appointmentId }}'
  ```
- **Notes:** Use RPC or HTTP node with Supabase REST API

### Step 3: Get Subscription Key (Decrypt)
- **Node name:** `Decrypt Subscription Key`
- **Type:** Supabase RPC
- **Credentials:** Supabase service role
- **RPC function:** `get_mydata_subscription_key`
- **Parameters:**
  ```json
  {
    "p_practitioner_id": "{{ $json.practitionerId }}"
  }
  ```
- **Output:** `subscription_key` (plaintext, decrypted from vault)
- **Notes:** This is the SECURITY DEFINER function we created. It returns the plaintext subscription key for use in AADE API call.

### Step 4: Build Receipt JSON
- **Node name:** `Build Receipt JSON`
- **Type:** Code node (JavaScript)
- **Input:** Connect from steps 2 & 3
- **Code:**
```javascript
const appointmentTime = new Date({{ $json.appointmentTime }});
const issueDate = appointmentTime.toISOString().split('T')[0]; // YYYY-MM-DD

return {
  issueDate,
  series: "AUTO",  // Standard series for auto-numbered receipts
  aa: {{ $json.appointmentId }}.substring(0, 8),  // Use first 8 chars of appointment ID as unique AA
  totalAmount: {{ $json.amount }},
  counterpart: {
    vatNumber: "{{ $json.vat_number }}",
    country: "GR"
  },
  invoiceDetails: [
    {
      lineNumber: 1,
      description: "Clinical Psychology Session - {{ $json.patient_name }} ({{ $json.patient_ref }})",
      quantity: 1,
      unitAmount: {{ $json.amount }},
      vatCategory: "VAT0",  // VAT-exempt
      vatAmount: 0,
      rowTotal: {{ $json.amount }}
    }
  ]
};
```
- **Notes:** 
  - `aa` must be unique per series. Using first 8 chars of UUID works (almost never collides).
  - `VAT0` = exempt (default for clinical psychology in Greece)
  - Description includes patient ref for audit trail

### Step 5: Submit to myDATA SendInvoices
- **Node name:** `Submit to AADE`
- **Type:** HTTP Request
- **Method:** POST
- **URL:** Depends on environment:
  - **Sandbox:** `https://mydataapidev.aade.gr/SendInvoices`
  - **Production:** `https://mydatapi.aade.gr/myDATA/SendInvoices`
  - **Use:** `{{ $json.mydata_environment === 'production' ? 'https://mydatapi.aade.gr/myDATA/SendInvoices' : 'https://mydataapidev.aade.gr/SendInvoices' }}`
- **Headers:**
  ```json
  {
    "aade-user-id": "{{ $json.mydata_username }}",
    "Ocp-Apim-Subscription-Key": "{{ steps['Decrypt Subscription Key'].output.data }}"
  }
  ```
- **Body:** Raw JSON (or JSON mode) — the receipt JSON from step 4
- **Error handling:** Set `Continue on fail: true` (we'll handle the error in a later IF)
- **Notes:**
  - AADE can be slow (15-30s); set timeout to 30s
  - Response includes `mark_uuid` (the AADE MARK) on success

### Step 6: Check if Submission Succeeded
- **Node name:** `Was Submission OK?`
- **Type:** IF (condition)
- **Condition:** `{{ steps['Submit to AADE'].statusCode === 200 }}`
- **True branch:** Go to step 7a (success update)
- **False branch:** Go to step 7b (failure update)

### Step 7a: Update Appointment — Success
- **Node name:** `Update Appointment (Success)`
- **Type:** Supabase / HTTP
- **Query:**
  ```sql
  UPDATE appointments
  SET 
    mydata_status = 'submitted',
    mydata_mark = '{{ steps['Submit to AADE'].output.data.mark_uuid }}',
    mydata_submitted_at = NOW(),
    mydata_invoice_uid = '{{ steps['Submit to AADE'].output.data.uid }}'
  WHERE id = '{{ $json.appointmentId }}'
  ```
- **Notes:** Store the AADE-issued MARK so we can display it in the UI

### Step 7b: Update Appointment — Failure
- **Node name:** `Update Appointment (Failed)`
- **Type:** Supabase / HTTP
- **Query:**
  ```sql
  UPDATE appointments
  SET mydata_status = 'failed'
  WHERE id = '{{ $json.appointmentId }}'
  ```
- **Also log to audit:**
  ```sql
  INSERT INTO mydata_audit_log (practitioner_id, appointment_id, action, environment, response_status, error_message, created_at)
  VALUES (
    '{{ $json.practitionerId }}',
    '{{ $json.appointmentId }}',
    'submit_receipt',
    '{{ $json.mydata_environment }}',
    {{ steps['Submit to AADE'].statusCode }},
    '{{ steps['Submit to AADE'].output.data.message }}',
    NOW()
  )
  ```

### Step 8: Respond
- **Node name:** `Respond to Webhook`
- **Type:** Respond to webhook
- **Status code:** 
  - If success: 200
  - If failure: 500 (but don't fail the workflow — let it finish and update appointment)

---

## Key Notes

### Subscription Key Decryption
The Supabase `get_mydata_subscription_key()` RPC function returns plaintext. It's:
- Service-role only (safe in n8n)
- Never logged (marked as password field if possible)
- Scoped to practitioner (fetched from vault by practitioner_id)

### AADE Response Format
On success, AADE returns:
```json
{
  "mark_uuid": "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
  "uid": "...",
  "statusCode": 200,
  "message": "SUCCESS"
}
```

On failure (e.g., bad creds):
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### Error Handling Strategy
- **Temporary failure (AADE down):** Mark appointment as `failed`, manually retry button available in UI
- **Bad credentials (401/403):** Mark as `failed`, practitioner must re-verify credentials in Settings
- **Validation error (400):** Mark as `failed`, log to audit_log for debugging

### 24-hour Deadline
Receipts must transmit within 24h of appointment. The workflow doesn't enforce this — it's the practitioner's responsibility to click "Issue receipt" within 24h of the session.

For future phases:
- Add a scheduled workflow that alerts practitioners if a confirmed appointment is >24h old with no receipt
- Add escalation to admin email if deadline passes

---

## Environment Variable

On the **dashboard**, set:
```bash
N8N_RECEIPT_WEBHOOK_URL=https://n8n.bookflow.uk/webhook/receipt-submit
```

(Replace with actual n8n webhook URL once you create the workflow and get the public URL)

---

## Testing Checklist

1. ✅ Create a test appointment (confirmed status)
2. ✅ In dashboard, click "Issue receipt" button
3. ✅ Modal opens with €50 default, edit to €75 for testing
4. ✅ Click confirm
5. ✅ Workflow executes:
   - [ ] Webhook receives data
   - [ ] Subscription key decrypts (not null)
   - [ ] Receipt JSON builds correctly
   - [ ] AADE request sends (check headers, URL, body)
   - [ ] Response parsed (MARK extracted)
   - [ ] Appointment updated with mydata_status='submitted', mydata_mark populated
6. ✅ Return to appointment detail page
7. ✅ Receipt badge shows "Issued" with AADE MARK displayed

---

## Future Enhancements

- Add support for mixed VAT (if vat_regime='mixed', prompt practitioner to categorize session)
- Add 24h deadline alerting
- Add bulk receipt re-submission for failed appointments
- Add receipt line-item customization (alternative descriptions, quantities, discounts)
