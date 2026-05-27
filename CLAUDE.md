# Bookflow Migration — CLAUDE.md

**Last updated:** 2026-05-27 (session 13 — Settings Tier 1 shipped: Profile + Security + Notifications tabs. Workflow #1 now reads `sms_reminder_enabled` + `reminder_offset_hours` from practitioner row.)

## Status Summary

✅ **Complete:**
- Supabase PostgreSQL schema (practitioners, patients, appointments, sms_log)
- Row-level security (RLS) policies for per-practitioner data isolation
- n8n Docker environment + Supabase credentials (Supabase, Google Calendar, Infobip, OpenAI all configured)
- Next.js dashboard (app.bookflow.uk) with Supabase Auth
- PWA setup (iOS/Android "Add to Home Screen")
- Cloudflare tunnel routing
- **Design System Overhaul** — light-first theme with optional dark mode, teal accent (#2DD4C0), responsive Tailwind + CSS Grid. ThemeScript prevents flash, ThemeToggle in topbar.
- **Sidebar navigation** — collapsible nav with Patients, Calendar, Billing, Settings routes. Mobile hamburger menu. User chip at bottom.
- **Updated branding** — light mode default (#F9FAFB bg, teal #2DD4C0 accent). Dark mode opt-in (#0F172A bg).
- **Mobile dashboard layout** — patients as cards, appointment detail, responsive 2-col layouts
- **First practitioner created** (Dr. Meimaris) — Supabase Auth user + practitioners row + linked Google Calendar
- **Workflow #1: Practitioner Sync** — published. Hourly trigger, GCal → parse → upsert appointment → SMS → sms_log. Dedup via relational sms_log query + on_conflict=google_event_id. Quota enforcement added.
- **Workflow #2: Clinical Scribe** — published. Fillout audio upload → Download → Whisper (el) → store raw_transcript → fetch all transcripts → GPT-4o Greek SOAP merger → store merged_clinical_summary → scribe_status=complete. Quota enforcement + duration cap added.
- **Workflow #3: Intake Form** — published. Fillout submission → parse phone → lookup patient → PATCH name/email/dob/intake_status=completed.
- **Workflow #4: Confirmation Click** — built as Next.js `/confirm/[id]`. Confirms appointment, redirects to intake form if pending, shows intake form button if already confirmed + intake pending.
- **Fillout intake form** — https://forms.fillout.com/t/udsRWfM9xeus (fields: name, phone, email, DOB, reason)
- **Fillout session recording form** — https://forms.fillout.com/t/vfU2uQ6pmSus (field: audio upload, URL param: appointment_id)
- `date_of_birth` column added to patients table (migration: `supabase/04_add_dob.sql`)
- `total_sessions` auto-increments via DB trigger when appointment status → confirmed
- Admin Supabase client at `dashboard/lib/supabase/admin.ts`
- All env vars wired: `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_INTAKE_FORM_URL`, `NEXT_PUBLIC_SCRIBE_FORM_URL`
- **Stripe integration** — checkout and portal endpoints built, plan selector UI complete, usage metering dashboard live, webhook handler syncs Supabase
- **Regenerate SOAP limiting** — tier-based quota system (Essentials: 25/month, Professional: 60/month, Premium: unlimited) with lazy monthly reset. Schema columns `regenerate_soap_count` and `regenerate_soap_reset_date` added. POST `/api/regenerate-soap` endpoint with 429 quota enforcement. GET `/api/practitioner-stats` endpoint for UI quota display. RegenerateSoapButton component (on patient page) shows remaining regens badge with color-coding (muted/amber/red).
- **Single-note PDF export** — GET `/api/appointments/[id]/export-pdf` endpoint generates SOAP note PDFs with proper Greek character rendering. Uses `pdf-lib` + `@pdf-lib/fontkit` + system Liberation Sans font. File downloads as `SOAP_{patient_ref}_{date}.pdf`. Authenticated via Bearer token, verifies practitioner ownership.
- **Session rate setting** — `rate_per_session_eur` column (default €50) on practitioners. Used in myDATA receipt generation. Editable in Settings → General tab.
- **Settings page with tabs** — `/app/dashboard/settings` is a 5-tab interface: General (session rate + language), Profile (name/email/phone/calendar_id, email change triggers Supabase Auth re-verification), Security (change password with current-password re-auth), Notifications (SMS reminder toggle + offset hours 1–168 + email digest toggle), myDATA (AADE creds + tax identity). Pill-style tabs share the `bf-nav-link` class with the Sidebar for consistent hover/active treatment.
- **Workflow #1 reads notification preferences** — `Get Active Practitioners` selects `sms_reminder_enabled` + `reminder_offset_hours`; `Get Events` `timeMax` is `$now + {reminder_offset_hours || 24}h`; `Should Send SMS?` skips the Infobip branch when `sms_reminder_enabled !== false`. Default fallback (24h, enabled) preserves legacy behaviour for unmigrated rows.
- **Loading UI (progress bar + skeletons)** — TopProgressBar global component listens to internal link clicks, shows teal indeterminate bar at top with 120ms delay. loading.tsx skeleton files for `/dashboard`, `/dashboard/patients/[id]`, `/dashboard/appointments/[id]`, `/dashboard/billing`, `/dashboard/settings` with structure-matched shimmer animations. Fixes perceived UI freezing on slow connections.
- **myDATA credential storage & verification (Phase 1)** — Supabase Vault (pgsodium) encrypts subscription keys at rest. SECURITY DEFINER functions `set_mydata_subscription_key()` / `get_mydata_subscription_key()` for safe RPC access. POST `/api/mydata/credentials` verifies creds against AADE sandbox before persisting (RequestDocs read-only probe). Audit-logs all attempts. v_practitioner_mydata_config view exposes config without secret.
- **Receipt issuance UI (Phase 2)** — Appointment detail page shows receipt status badge (issued/pending/failed). "Issue receipt" button on confirmed appointments opens modal with editable amount (defaults to rate_per_session_eur). POST `/api/appointments/[id]/issue-receipt` triggers n8n Workflow #5. Manual retry button if failed.
- **Workflow #5: Receipt submission to myDATA (Phase 2 — REBUILT)** — Imported to n8n, ready for sandbox test.
  - **What changed (session 8):** Full rewrite with AADE-compliant XML (not JSON). 17-node workflow: (1) Webhook trigger, (2) Get appointment context with embedded practitioners/patients joins, (3) Decrypt subscription key via RPC, (4) Guard: fail if no key, (5) Build AADE `InvoicesDoc` XML with `invoiceType=11.2` (retail receipt), `vatCategory=7 + vatExemptionCategory=4` (Art. 22 exemption), `E3_561_003/category1_3` (retail clinical services), series='A', aa=epoch-timestamp, (6) Submit XML to AADE `SendInvoices` (sandbox or production endpoint auto-selected), (7) Parse AADE XML response, (8) Extract invoiceMark/invoiceUid/errors, (9) IF success: PATCH appointment + log success audit, (10) IF failure: PATCH appointment + log failure audit, respond 200/500.
  - **Status:** Workflow imported + published in n8n. Dashboard env var `N8N_RECEIPT_WEBHOOK_URL` needs the published webhook URL (format: `https://n8n.bookflow.uk/webhook/receipt-submit`). **Sandbox test not yet run** — next step is confirm a test appointment → issue receipt (€50) → verify AADE MARK appears in dashboard + audit log. Build instructions in WORKFLOW-5-BUILD-INSTRUCTIONS.md (replaces old WORKFLOW-5-RECEIPT-SUBMISSION.md).
- **Calendar page** — `/dashboard/calendar` route delivered. Day / Week / Month views (week is default), URL-driven state (`?view=week&date=YYYY-MM-DD`) for shareable links + browser back/forward, click an appointment → slide-out detail panel with workflow signals (intake ✓ / SOAP ✓ / receipt ✓) and links to the full `/dashboard/appointments/[id]` page. Current-time line in day/week, "today" highlight in month, mobile defaults to day view. RLS-scoped server fetch via `v_appointment_full`. 50-minute default block size (no `end_time` column yet). Files in `dashboard/app/dashboard/calendar/` (utils + page + Calendar + CalendarHeader + DayView + WeekView + MonthView + AppointmentBlock + AppointmentPanel + loading). "+ New appointment" button is intentionally disabled with a tooltip — appointments still flow from GCal sync via Workflow #1; inline create is deferred until GCal write integration ships.
- **Dashboard i18n (Greek ↔ English language toggle)** — Phase A + Phase B complete. New `practitioners.locale` column (default `'el'`, target market is Greek), `/api/practitioner-settings/locale` PATCH endpoint that writes DB + mirrors the value to a `bf_locale` cookie for fast SSR reads. Hand-rolled `lib/i18n/` package: typed `dictionary.ts` (~210 keys, source-of-truth shape comes from the English dict), `server.ts` (`getLocale()` cookie-first with DB fallback + `getT()` for server components), `client.tsx` (`LocaleProvider` + `useT()` hook). `LocaleProvider` mounted at the root layout — covers auth pages too — so `<html lang>` is dynamic. Settings → General has a two-button segmented "Language" toggle (English / Ελληνικά) with optimistic UI and `router.refresh()` on save. Every dashboard surface translated: Sidebar, Settings (General + myDATA), Calendar (header, day labels, panel), Patients (list + detail + RegenerateSoap), Appointments (detail + TranscriptEditor + StatusActions + IssueReceiptModal + ReceiptSection), Billing (page + PlanSelector with localized plan features + ManageButton), Login/Forgot/Reset auth pages, LogoutButton, ThemeToggle. All `toLocaleString` / `toLocaleDateString` calls now use the `bcp` value from `useT()`/`getT()` (`el-GR` or `en-GB`) so weekday/month names flip with the toggle. Patient-facing `/confirm/*` pages remain Greek-only by design (their audience is the patient, not the practitioner).

---

## Tech Stack

| Component | Tech |
|---|---|
| App database | Supabase (PostgreSQL 15) |
| Automation | n8n (Docker) |
| Dashboard | Next.js 16.2.6 (app.bookflow.uk) |
| Auth | Supabase Auth (email/password per practitioner) |
| SMS | Infobip API (outbound only — Greek leg does not support 2-way) |
| Audio transcription | OpenAI Whisper |
| AI analysis | OpenAI GPT-4o |
| Forms | Fillout |
| PDF generation | pdf-lib + @pdf-lib/fontkit (server-side, Greek Unicode support) |
| Public access | Cloudflare Tunnel (n8n.bookflow.uk, app.bookflow.uk) |
| Payments | Stripe |

---

## Project Structure

```
bookflow-migration/
├── supabase/
│   ├── 01_schema.sql       # Tables, enums, triggers, views, sequences
│   ├── 02_rls.sql          # Row-level security policies
│   ├── 03_seed.sql         # Test data (dev only)
│   ├── 04_add_dob.sql      # date_of_birth column on patients
│   ├── 05_billing.sql      # plan_tier, billing_status, stripe ids
│   ├── 06_mydata.sql       # myDATA integration schema
│   ├── 07_add_audio_duration.sql  # audio_duration_seconds on appointments
│   ├── 08_billing.sql      # Stripe subscription fields
│   ├── 09_usage_metering_view.sql # v_practitioner_usage_monthly
│   ├── 10_regenerate_soap_usage.sql # regenerate_soap_count tracking
│   ├── 11_mydata.sql       # myDATA credentials + audit log (UPDATED session 8)
│   ├── 12_mydata_pending_at.sql  # mydata_pending_at timestamp (Session 9)
│   └── 13_locale.sql       # practitioners.locale en|el, default 'el' (Session 10)
├── dashboard/              # Next.js app (app.bookflow.uk)
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── dashboard/
│   │       ├── page.tsx (patients list)
│   │       ├── patients/[id]/page.tsx (appointments)
│   │       ├── appointments/[id]/
│   │       │   ├── page.tsx (session detail with StatusActions, IssueReceiptModal, ReceiptSection)
│   │       │   ├── StatusActions.tsx (Mark Attended/Cancelled buttons)
│   │       │   ├── IssueReceiptModal.tsx (late-receipt warning)
│   │       │   └── ReceiptSection.tsx (receipt status, issue/reset buttons)
│   │       ├── calendar/        # Session 10 — unified appointment calendar
│   │       │   ├── page.tsx (server fetch via v_appointment_full, parses ?view + ?date)
│   │       │   ├── Calendar.tsx (client orchestrator, URL state, side panel)
│   │       │   ├── CalendarHeader.tsx (Prev/Today/Next + view toggle)
│   │       │   ├── DayView.tsx / WeekView.tsx / MonthView.tsx
│   │       │   ├── AppointmentBlock.tsx (positioned block for day/week timeline)
│   │       │   ├── AppointmentPanel.tsx (slide-out detail with workflow signals)
│   │       │   ├── utils.ts (date math + status color map + 50-min SESSION_MINUTES)
│   │       │   └── loading.tsx
│   │       └── settings/
│   │           ├── page.tsx (tabbed settings — passes initialLocale to GeneralTab)
│   │           ├── SettingsTabs.tsx (client tabs orchestrator)
│   │           ├── GeneralTab.tsx (session rate + language toggle)
│   │           └── MyDataTab.tsx (AADE credentials)
│   ├── app/api/
│   │   ├── appointments/[id]/
│   │   │   ├── issue-receipt/route.ts
│   │   │   ├── status/route.ts (Mark Attended/Cancelled)
│   │   │   ├── reset-receipt/route.ts (Clear stuck pending)
│   │   │   └── export-pdf/route.ts
│   │   ├── stripe/
│   │   │   ├── checkout/route.ts
│   │   │   ├── webhook/route.ts
│   │   │   └── portal/route.ts
│   │   ├── regenerate-soap/route.ts
│   │   ├── practitioner-stats/route.ts
│   │   ├── practitioner-config/route.ts
│   │   ├── practitioner-settings/rate/route.ts
│   │   ├── practitioner-settings/locale/route.ts  # Session 10 — en|el toggle
│   │   └── mydata/credentials/route.ts
│   ├── lib/supabase/
│   │   ├── client.ts (browser)
│   │   └── server.ts (server-side)
│   ├── lib/i18n/              # Session 10 — locale system
│   │   ├── dictionary.ts (~210 typed keys, en + el, source-of-truth: en)
│   │   ├── server.ts (getLocale + getT for server components, cookie-first fallback DB)
│   │   └── client.tsx (LocaleProvider + useT hook)
│   ├── components/LogoutButton.tsx
│   ├── public/
│   │   ├── logo.png (transparent background)
│   │   ├── manifest.json
│   │   └── icons/
│   ├── Dockerfile
│   ├── next.config.ts
│   └── .dockerignore
├── n8n-workflows/          # JSON exports
│   ├── 01-practitioner-sync/workflow.json
│   ├── 02-clinical-scribe/workflow.json
│   ├── 02c-clinical-scribe-error-handler/workflow.json
│   ├── 03-intake-form/workflow.json
│   ├── 04-confirmation-trigger/workflow.json
│   ├── 05-receipt-submission/workflow.json
│   └── 05c-receipt-submission-error-handler/workflow.json
├── docker-compose.yml
├── .env                    # Postgres + Supabase keys
└── CLAUDE.md (this file)
```

---

## Key Credentials & Configs

### Supabase
- **Project URL:** `https://dgnkvrjwfbdsdcuxsruk.supabase.co`
- **Anon key (publishable):** `sb_publishable_SVlFliE22H5J61MPUk7vUw_dIaulQ7l`
- **Service role key:** Stored in n8n credentials only (never commit)
- **Dashboard:** Supabase → Project Settings → API

### n8n
- **Public URL:** `https://n8n.bookflow.uk`
- **Credentials stored:** Supabase Service Role (HTTP Header Auth), Google Calendar OAuth, Infobip API key
- **Database:** Local Postgres (Docker, port 5432)

### Cloudflare Tunnel
- **Tunnel name:** BookFlow-Server
- **Routes:**
  - `n8n.bookflow.uk` → `localhost:5678` (n8n)
  - `app.bookflow.uk` → `localhost:3000` (Next.js dashboard)

### Dashboard (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://dgnkvrjwfbdsdcuxsruk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_SVlFliE22H5J61MPUk7vUw_dIaulQ7l
SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>   # required for /confirm server action (admin client bypasses RLS)
NEXT_PUBLIC_INTAKE_FORM_URL=                   # Fillout form URL — empty until form created
NEXT_PUBLIC_SCRIBE_FORM_URL=                   # Fillout audio recording form URL
STRIPE_SECRET_KEY=<stripe-secret-key>          # Required for checkout and portal endpoints
STRIPE_WEBHOOK_SECRET=<stripe-webhook-secret>  # Required to verify Stripe webhook signatures
NEXT_PUBLIC_APP_URL=https://app.bookflow.uk    # Used in Stripe redirects and SMS confirmation links
```

### Stripe
- **Publishable key:** In next env vars (not needed server-side)
- **Secret key:** `STRIPE_SECRET_KEY` — never expose to browser
- **Webhook secret:** `STRIPE_WEBHOOK_SECRET` — used to verify `/api/stripe/webhook` requests
- **Webhook events configured:** `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
- **Webhook destination:** `https://app.bookflow.uk/api/stripe/webhook`

### Infobip
- **API base:** `https://d88mkr.api.infobip.com`
- **Sender ID:** `BookFlow`
- **Phone format:** must be `306979244944` (country code + number, no `+`, spaces, or dashes). Workflow #1 normalises any input format from GCal description.
- **IMPORTANT:** Infobip Greek SMS is **outbound only** — no two-way SMS support. All confirmations/replies handled via web links (Workflow #4).

---

## Design System & UI Components (Session 4)

### Theme System
- **Files:**
  - `app/globals.css` — Complete token system with CSS custom properties. `:root` selector for light mode, `.dark` selector for dark mode. Defines colors, typography, spacing, shadows, borders, radius, status colors (success, warning, danger).
  - `components/ThemeScript.tsx` — Inlined script (runs before React hydration) that checks localStorage + system preference, applies `.dark` class to `<html>` to prevent flash.
  - `components/ThemeToggle.tsx` — Client component with sun/moon SVG icons. Toggles `document.documentElement.classList` and persists to localStorage.

- **Utility Classes:** Defined in globals.css for consistency:
  - `bf-card` — Surface with border and shadow
  - `bf-input` — Text input, textarea, select styling with focus states
  - `bf-btn-primary` — Teal solid button (accent color)
  - `bf-btn-secondary` — Outline button
  - `bf-badge` — Inline badge with variants (success, warning, danger, info, muted)
  - `bf-nav-link` — Navigation link styling with active state
  - `bf-skeleton` — Shimmering placeholder for loading states (animated gradient)
  - `bf-skeleton-circle` — Circular skeleton variant (avatar placeholders)
  - `bf-progress-bar` / `bf-progress-bar__fill` — Top navigation progress bar styles
  - Scrollbar styling for dark mode

### Layout Components
- **`components/Sidebar.tsx`**
  - Fixed left sidebar (256px on lg, collapses on mobile)
  - Hamburger menu toggle on mobile
  - Nav items: Patients, Calendar, Billing, Settings
  - Active route detection
  - User chip at bottom with practitioner name + initials avatar
  - Icons via inline SVG for consistency

- **Topbar** (in `app/dashboard/layout.tsx`)
  - Sticky header with backdrop blur
  - ThemeToggle (sun/moon icon, right side)
  - LogoutButton (right side)
  - Responsive grid layout

- **`components/TopProgressBar.tsx`**
  - Global client component that renders at page root (inside Suspense in root layout)
  - Listens to clicks on internal `<a>` and Next `<Link>` elements
  - Shows teal indeterminate animation bar at top of viewport when navigation pending
  - 120ms delay before showing (avoids flash on fast transitions)
  - 15s safety timeout (auto-hides if something stalls)
  - Auto-hides when pathname/searchParams change (route resolved)
  - Skips external URLs, target=`_blank`, modified clicks (meta/ctrl/shift)

### Pages Redesigned (Session 4)
- **`app/layout.tsx`**
  - Root layout with ThemeScript injection
  - `suppressHydrationWarning` on `<html>` tag

- **`app/login/page.tsx`**
  - Centered card design
  - Email + password inputs using `bf-input` class
  - "Forgot password?" link next to password label
  - friendlyError() function for user-friendly error messages (rate limits, invalid email, etc.)
  - Browser autocomplete hints enabled

- **`app/forgot-password/page.tsx`** (NEW)
  - Email entry form with validation
  - Shows success state ("Check your email for reset instructions") after submission
  - Calls `supabase.auth.resetPasswordForEmail()` with redirect to `/reset-password`
  - friendlyError() handles rate limit and invalid email errors

- **`app/reset-password/page.tsx`** (NEW)
  - Password + confirm password fields
  - Client-side validation: 8+ chars, fields match
  - Verifies session exists (from email recovery link)
  - Calls `supabase.auth.updateUser({ password })`
  - Shows success state, then auto-redirects to `/dashboard`

- **`app/dashboard/layout.tsx`**
  - Adds Sidebar + topbar wrapper
  - Sidebar fixed positioning, lg:pl-64 on main content for desktop
  - Mobile hamburger toggle

- **`app/dashboard/page.tsx`** (patients list)
  - KPI strip: 4 MetricCard components showing total patients, intake completed, intake pending, total sessions
  - Clean responsive table with patient avatars, ref, name, session count, intake status badge
  - "New patient" button (placeholder for future intake flow)

- **`app/dashboard/patients/[id]/page.tsx`**
  - Patient avatar header card with name, ref, email, phone, intake status badge
  - 3 mini stats: Sessions, Upcoming appointments, Completed
  - **Merged SOAP summary section** (if available) with RegenerateSoapButton component (regenerates merged SOAP from all transcripts, quota-gated by tier)
  - Appointments list with status badges (scheduled, confirmed, completed) and scribe status

- **`app/dashboard/patients/[id]/RegenerateSoapButton.tsx`**
  - Client component with Regenerate SOAP button (calls POST `/api/regenerate-soap`)
  - Quota badge showing X/Y regens remaining (or "Unlimited" for premium)
  - Color-coded badge: muted (normal), amber (80%+), red (100%)
  - Toast feedback on success/failure or quota exceeded

- **`app/dashboard/appointments/[id]/page.tsx`**
  - 2-column responsive layout: transcript main + patient info sidebar
  - Header with appointment summary, time, status badges
  - TranscriptEditor component (editable/view mode)
  - Patient sidebar with contact details + receipt issuance UI
  - **Session notes:** practitioner's post-session dictation (transcribed by Whisper)

- **`app/dashboard/appointments/[id]/TranscriptEditor.tsx`**
  - Edit/view toggle mode
  - Textarea for raw transcript (practitioner dictation, 2–5 min)
  - Save button calls updateTranscript action
  - Export PDF button generates SOAP note PDF with Greek support
  - No regenerate button (moved to patient page)

- **`app/dashboard/billing/page.tsx`** (NEW)
  - Server component fetches practitioner plan, billing status, trial/renewal dates from Supabase
  - Fetches usage data from `v_practitioner_usage_monthly` view (SMS sent, scribe minutes used)
  - Success/cancel banners from Stripe checkout redirects
  - Current plan card: tier name, status badge, trial/renewal dates, "Manage subscription" button
  - UsageCard components (SMS and Scribe) with progress bars (orange 80%+, red 100%+, warning text)
  - PlanSelector component for plan switching/selection

- **`app/dashboard/billing/PlanSelector.tsx`** (NEW)
  - 3-plan card layout: Essentials, Professional (highlighted), Premium
  - Monthly/annual toggle button with "Save 17%" badge
  - Each plan shows: name, tagline, €price/month, annual effective, 6+ features with checkmark icons
  - "Current plan" badge on active tier
  - Button text: "Choose plan" (trial), "Switch plan" (active), "Current plan" (current tier)
  - Calls POST `/api/stripe/checkout` with plan_tier + billing_period
  - Redirects to Stripe Checkout URL on success
  - Error handling with user-friendly messages

- **`app/dashboard/billing/ManageButton.tsx`** (NEW)
  - Client component
  - Calls POST `/api/stripe/portal`
  - Opens Stripe customer portal (manages payment methods, invoices, subscription)
  - Shows loading state and error messages

---

## Database Schema

### Tables
- **practitioners** — `id (UUID)`, `user_id (FK to auth.users)`, `name`, `calendar_id (GCal)`, `email`, `phone`, `status`, `setup_fee_paid`, `plan_tier` (essentials|professional|premium, default essentials), `billing_status` (trial|active|past_due|cancelled, default trial), `trial_ends_at` (timestamp), `current_period_start` (date), `current_period_end` (date), `stripe_customer_id`, `stripe_subscription_id`, `billing_email`, timestamps
- **patients** — `id (UUID)`, `patient_ref (PT-0001)`, `name`, `email`, `phone`, `intake_status`, `intake_form_link`, `total_sessions`, `merged_clinical_summary`, timestamps
- **appointments** — `id (UUID)`, `google_event_id (UNIQUE, upsert key)`, `practitioner_id (FK)`, `patient_id (FK)`, `appointment_time`, `summary`, `status`, `fillout_link`, `audio_file_url`, `audio_duration_seconds`, `raw_transcript` (Whisper), `scribe_status`, timestamps
- **sms_log** — `id (UUID)`, `appointment_id (FK)`, `patient_id (FK)`, `phone`, `message_body`, `infobip_msg_id`, `status`, `sent_at`

### Views
- **v_appointment_full** — Flat view joining appointments + practitioners + patients (used by n8n for context)
- **v_patient_transcripts** — All raw_transcript entries per patient ordered by date (used for GPT-4o merger logic)
- **v_practitioner_usage_monthly** — Groups appointments by practitioner + calendar month, returns `sms_sent_count` (from sms_log status='sent') and `scribe_minutes_used` (sum of audio_duration_seconds/60 where scribe_status='complete'). Foundation for quota enforcement and usage dashboards.

### API Routes (Appointments & Receipts, Session 9)
- **`POST /api/appointments/[id]/status`** — Mark attended/cancelled. Transitions appointment status from scheduled/confirmed to completed/cancelled. Verifies practitioner ownership, validates status transitions.
- **`POST /api/appointments/[id]/reset-receipt`** — Clear stuck pending state. Resets mydata_status and mydata_pending_at. Only allowed when mydata_status='pending' or 'failed' (not submitted). Manual escape hatch for stuck "Submitting to AADE…" UI states.
- **`POST /api/appointments/[id]/issue-receipt`** — Trigger receipt submission to myDATA. Validates appointment is confirmed/completed, updates to pending, calls n8n Workflow #5 webhook. Rolls back to failed if webhook fails.
- **`GET /api/appointments/[id]/export-pdf`** — Generate SOAP note PDF with Greek character support. Uses pdf-lib + fontkit. Authenticated via Bearer token.

### API Routes (Stripe, Session 4)
- **`app/api/stripe/checkout/route.ts`** (POST)
  - Authenticates via Authorization Bearer token
  - Validates plan_tier (essentials|professional|premium) and billing_period (monthly|annual)
  - Fetches practitioner email from Supabase
  - Creates Stripe checkout session with:
    - currency: 'eur'
    - recurring: { interval: 'month' | 'year' }
    - subscription_data.metadata: practitioner_id, plan_tier, billing_period
    - Success redirect: `/dashboard/billing?checkout=success&plan={tier}&period={period}`
    - Cancel redirect: `/dashboard/billing?checkout=cancelled`
  - Returns `{ url: session.url }` to redirect browser
  - Errors: 401 (auth), 404 (practitioner), 400 (invalid plan/period), 500 (Stripe failure)

- **`app/api/stripe/webhook/route.ts`** (POST)
  - Verifies Stripe signature via `STRIPE_WEBHOOK_SECRET`
  - Handles 4 event types:
    - `customer.subscription.created`: PATCHes practitioners with plan_tier, billing_status='active', period_start/end, stripe_customer_id, stripe_subscription_id
    - `customer.subscription.updated`: Updates period dates and billing_status in sync with Stripe
    - `customer.subscription.deleted`: Sets billing_status='cancelled'
    - `invoice.payment_failed`: Sets billing_status='past_due'
  - All updates keyed by practitioner_id from subscription.metadata
  - Errors: 400 (invalid signature), 404 (practitioner not found), 500 (Supabase failure)

- **`app/api/stripe/portal/route.ts`** (POST, NEW)
  - Authenticates via Authorization Bearer token
  - Fetches practitioner.stripe_customer_id from Supabase
  - Creates Stripe billing portal session (allows customer to manage payment methods, invoices, update subscription)
  - Return URL: `/dashboard/billing`
  - Returns `{ url: session.url }` to redirect browser
  - Errors: 401 (auth), 404 (no stripe_customer_id), 500 (Stripe failure)

### Enums
- `practitioner_status` → active | inactive
- `intake_status` → pending | completed
- `scribe_status` → pending | transcribing | complete | failed
- `appointment_status` → scheduled | confirmed | completed | cancelled

### Triggers
- `set_updated_at()` — Auto-updates `updated_at` timestamp on all main tables
- `set_patient_ref()` — Auto-generates `patient_ref` (PT-0001, PT-0002...) on insert

---

## Dashboard Flows

### Login → Patients → Appointments → Session Detail
1. User logs in with email/password (Supabase Auth)
2. Redirected to `/dashboard` (patients list)
3. Click patient → `/dashboard/patients/[id]` (appointments for that patient)
4. Click appointment → `/dashboard/appointments/[id]` (session transcript + "Record Session Notes" button)
5. Button links to Fillout form for audio recording

---

## myDATA Integration (Session 6 — Phase 1: Credential Management)

### Schema (`supabase/11_mydata.sql`)
- **Enums:** `mydata_environment` (sandbox | production), `vat_regime` (exempt | standard | mixed)
- **Columns on practitioners:**
  - `rate_per_session_eur` DECIMAL(10,2) DEFAULT 50.00 — used in receipt generation
  - `mydata_username`, `mydata_subscription_key_secret_id` (FK to vault.secrets), `mydata_environment`, `mydata_credentials_verified`, `mydata_credentials_verified_at`
  - Tax identity: `vat_number` (ΑΦΜ, 9 digits), `kad_code` (869014|869039), `business_address`, `vat_regime`, `has_taxable_secondary_activity` BOOLEAN
  - CHECK: verified=true requires all tax-identity fields present
- **Tables:**
  - `mydata_audit_log` — every credential verification & receipt submission attempt, redacted (never stores secret key)
  - **Appointments additions:** `mydata_mark` (AADE MARK when issued), `mydata_status` (pending|submitted|failed|cancelled), `mydata_submitted_at`, `mydata_invoice_uid`
- **Functions (SECURITY DEFINER, service-role only):**
  - `set_mydata_subscription_key(practitioner_id, key)` — insert or rotate secret in Vault, return secret_id
  - `get_mydata_subscription_key(practitioner_id)` — decrypt & return plaintext (service-role only)
- **View:** `v_practitioner_mydata_config` — safe config view with `has_subscription_key` boolean (no plaintext)

### API Routes
- **`/api/practitioner-config` (GET)** — fetch safe v_practitioner_mydata_config view for authenticated user
- **`/api/practitioner-settings/rate` (PATCH)** — update `rate_per_session_eur`
- **`/api/mydata/credentials` (POST)** — verify credentials against AADE sandbox (RequestDocs read-only probe), then store via Vault + update practitioners. Never persists bad credentials. Returns 400 with user-friendly error if AADE rejects. Logs all attempts to mydata_audit_log (redacted).

### Settings UI
- **`/app/dashboard/settings`** — tabbed interface
  - **General tab** — session rate (€, default €50)
  - **myDATA tab** — AADE username, subscription key (password field; leave blank on update to keep existing), environment toggle (sandbox default), KAD code dropdown, VAT regime selector, business address, secondary-activity checkbox, explicit authorization checkbox

### Philosophy
- **Sandbox-first:** Settings default to `mydata_environment='sandbox'`. Safe for testing before production.
- **No persistence on failure:** Credentials verified against AADE before writing to DB. AADE 401/403 returns with "check credentials" message.
- **Encryption at rest:** Subscription key stored in Supabase Vault. Never logged, never exposed via unguarded RPC.
- **Audit trail:** Every attempt (verify, submit receipt) logged to mydata_audit_log with response status, errors, and AADE MARK when issued.

### Phase 2: Receipt Submission (Documented, Awaits n8n Build)
- ✅ **Appointment detail page enhancements** — receipt status badge (issued/pending/failed), "Issue receipt" button, modal with editable amount, AADE MARK display on success, manual retry button on failure
- ✅ **API route: POST `/api/appointments/[id]/issue-receipt`** — takes amount, marks appointment pending, calls n8n webhook
- ✅ **Workflow #5 specification** — comprehensive step-by-step guide (see WORKFLOW-5-RECEIPT-SUBMISSION.md), ready to build in n8n:
  - Webhook trigger (receives appointment + amount)
  - Fetch appointment details + decrypt subscription key via RPC
  - Build receipt JSON (VAT-exempt)
  - POST to myDATA SendInvoices (sandbox or production endpoint)
  - Update appointment with AADE MARK on success, failed status on error
  - Log to audit_log
- 🚀 **Next step:** Build Workflow #5 in n8n UI (copy step-by-step guide or import JSON once exported)
- **Future:** 24h deadline alerting, bulk resubmission, mixed VAT support

---

## The Four n8n Workflows

### Workflow #1: Practitioner Sync ✅ BUILT
**Trigger:** Hourly schedule (not GCal webhook — polling avoids GCal push complexity)
**Flow (13 nodes, see `n8n-workflows/01-practitioner-sync/workflow.json`):**
1. **Hourly Trigger** — every 1 hour
2. **Get Active Practitioners** — Supabase HTTP GET, status=active
3. **Split Practitioners** — pass-through code node (HTTP already split into items)
4. **Get Events ~24h Ahead** — Google Calendar getAll, calendar_id from `$json.calendar_id`, window `$now` → `$now + 24h`, singleEvents=true
5. **Parse Event** — extract patient name from event.summary (strip prefixes/parens), normalise phone from event.description to `306979244944` Infobip format (handles +30, spaces, dashes; auto-prepends `30` for 10-digit Greek mobiles starting with 6)
6. **Get Patient by Phone** — Supabase lookup by phone (alwaysOutputData=true so empty results don't drop the item)
7. **Patient Found?** — IF on `$json.id` notEmpty (string)
8. **Create Patient** (false branch) — POST patients, intake_status=pending
9. **Upsert Appointment** — POST appointments with `?on_conflict=google_event_id` and `Prefer: resolution=merge-duplicates,return=representation`. Body references `$('Parse Event')`, `$('Split Practitioners')`, and `$json.id` for patient_id.
10. **Check SMS Already Sent** — relational query `appointments?id=eq.{{id}}&select=id,sms_log(id,status)` (one row per appointment guaranteed; alwaysOutputData=true)
11. **Should Send SMS?** — IF (a) `($json.sms_log || []).filter(l => l.status === 'sent').length === 0` AND (b) `$('Parse Event').item.json.patient_phone` notEmpty
12. **Send SMS** — Infobip POST with Greek reminder text + confirmation link `https://app.bookflow.uk/confirm/{appointment_id}`
13. **Log SMS** — POST sms_log with status=sent, infobip_msg_id

**Notification preferences (Session 13):** *Get Active Practitioners* now selects `sms_reminder_enabled` + `reminder_offset_hours`. *Get Events* uses `$now.plus({hours: reminder_offset_hours || 24})` as `timeMax` so each practitioner gets their own forward-look window. *Should Send SMS?* has a third condition `sms_reminder_enabled !== false` so a disabled toggle skips Infobip entirely (still logs nothing, just bypasses the branch).

**Key dedup mechanisms:**
- `google_event_id` UNIQUE on appointments → upsert prevents duplicate appointments
- Embedded relational query in Check SMS Already Sent guarantees consistent item flow (avoids n8n auto-dropping empty results from separate sms_log query)
- sms_log filtered by status='sent' prevents resending

### Workflow #2: Clinical Scribe ✅ BUILT
**Trigger:** Webhook (audio file upload from dashboard Fillout form)
**Purpose:** Practitioner dictates **post-session notes** (NOT the session itself) — typically 2-5 minutes of audio
**Flow:**
1. Receive audio file
2. Transcribe via OpenAI Whisper
3. Store as `raw_transcript` on appointment
4. Fetch all past transcripts for patient (v_patient_transcripts view)
5. Pass to GPT-4o with merger prompt
6. Store merged SOAP in `patients.merged_clinical_summary`
7. Update `scribe_status` to complete

**Prompt (Greek):** "You are a clinical psychologist scribe. Create a very concise SOAP note in Greek based only on the provided transcript..."

### Workflow #3: Intake Form ✅ BUILT
**Trigger:** Fillout form submission webhook
**Flow:**
1. Extract patient data (name, email, phone, notes)
2. Create or link patient record in Supabase
3. Update appointment with patient_id
4. Delete temporary/duplicate records

### Workflow #4: Confirmation Click ✅ BUILT (in Next.js, not n8n)
**Trigger:** SMS link → `https://app.bookflow.uk/confirm/[appointment_id]`
**Implementation:** Next.js page + server action (no n8n needed)
**Files:**
- `dashboard/app/confirm/[id]/page.tsx` — fetches appointment via admin client (v_appointment_full), shows patient name, practitioner, time, and confirm button. Handles already-confirmed and cancelled states.
- `dashboard/app/confirm/[id]/actions.ts` — server action: updates appointment.status='confirmed'; if patient.intake_status='pending' redirects to `NEXT_PUBLIC_INTAKE_FORM_URL`, else to `/confirm/[id]/done`.
- `dashboard/app/confirm/[id]/done/page.tsx` — gold-on-black success page ("Το ραντεβού επιβεβαιώθηκε").
- `dashboard/lib/supabase/admin.ts` — service-role client (bypasses RLS), used only server-side.

---

## Common Commands

### Docker
```bash
# Start all services
docker-compose up -d

# Rebuild dashboard after code changes
docker-compose up -d --build dashboard

# View logs
docker-compose logs -f n8n
docker-compose logs -f dashboard

# Stop all
docker-compose down
```

### Deploy Dashboard Changes
1. Update Next.js code in `dashboard/`
2. Run: `docker-compose up -d --build dashboard`
3. Changes live at `app.bookflow.uk` within ~30s

### Supabase SQL
Run in Supabase SQL Editor:
- `01_schema.sql` first (creates all tables/enums/functions)
- `02_rls.sql` second (enables RLS policies)
- `03_seed.sql` only for dev/test
- `04_add_dob.sql` — date of birth column
- `05_billing.sql` — PLANNED: subscription/billing fields

---

## Setup Checklist (for new practitioner)

- [ ] Create Supabase Auth user (email + password)
- [ ] Insert `practitioners` row with `user_id` = auth.users.id
- [ ] Set `calendar_id` = practitioner's Google Calendar email
- [ ] Link Google Calendar to n8n (OAuth)
- [ ] Test: Create GCal event → should appear as appointment in Supabase + SMS sent to test number
- [ ] Practitioner logs into `app.bookflow.uk` → sees their patients list

---

## Branding (Updated Session 4)

**Theme System:** Light-first design with optional dark mode toggle. CSS custom properties in `app/globals.css` define complete token system with `:root` (light) and `.dark` selector (dark).

- **Light Mode (default):**
  - Background: `#F9FAFB` (off-white)
  - Surface: `#FFFFFF` (white cards)
  - Accent: `#2DD4C0` (teal, primary action)
  - Text: `#0F172A` (near-black)
  - Muted text: `#64748B` (slate)
  - Success: `#10B981` (emerald)
  - Warning: `#F59E0B` (amber)
  - Danger: `#EF4444` (red)

- **Dark Mode:**
  - Background: `#0F172A` (deep navy)
  - Surface: `#1E293B` (slate-800 cards)
  - Accent: `#2DD4C0` (teal, unchanged for consistency)
  - Text: `#F1F5F9` (off-white)
  - Muted text: `#94A3B8` (slate-400)

- **Logo:** `dashboard/public/logo.png` (transparent PNG, 160x160 min)
- **Tagline:** "Automate. Integrate. Elevate."
- **Theme persistence:** Stored in localStorage, checked on page load via inlined ThemeScript to prevent flash

---

## Working Principles

**Finish what you start before moving to new features.** Once a feature's implementation begins (Phase 1, Phase 2, etc.), complete it fully — all code, tests, documentation — before starting unrelated work. This keeps complexity bounded and prevents scattered context. Exception: if a dependency blocks you, pause and file it clearly, but don't move to a different feature.

---

## Architecture Decisions

**Why Scribe Inputs merged into Appointments?**
Postgres has proper FKs — no need for a separate table. One query fetches appointment + audio + transcript + clinical note.

**Why `google_event_id` as upsert key?**
GCal can fire the same event multiple times (edit, reminder, etc.). Upsert by event ID prevents duplicates silently.

**Why `patient_ref` (PT-0001) instead of UUID in SMS?**
UUIDs are 36 chars and hostile in URLs. Patient references are short, readable, and never exposed to end users.

**Why RLS policies if n8n uses service_role?**
Defence in depth. `service_role` bypasses RLS at Postgres level, but policies protect against anon key leaks or future client auth.

**Why PWA instead of native app?**
For internal practitioner tools with <100 users, PWA is faster to build, easier to maintain, and instant updates. No App Store gatekeeping.

**Why dictation, not full-session recording, for the scribe?**
The scribe transcribes the practitioner's post-session notes (2-5 min dictation), NOT the session itself. This sidesteps patient consent issues, reduces API costs ~90%, and matches how clinicians actually work — many already use basic phone recorders for this. Hard cap: 8 min per dictation, soft warn at 5 min.

---

## Pricing Plan (decided 2026-05-18)

Three tiers. All paid tiers include every feature; what scales is depth and limits.

| | **Essentials** | **Professional** | **Premium** |
|---|---|---|---|
| **Monthly** | €59 | €119 | €229 |
| **Annual (effective/mo)** | €49 | €99 | €191 |
| GCal sync | ✅ | ✅ | ✅ multi-calendar |
| SMS reminders/month | 100 | 500 | 1,500 |
| Confirmation-click flow | ✅ | ✅ | ✅ |
| AI Scribe dictation/month | 30 min | 10 hours | 30 hours |
| Longitudinal SOAP merge | ❌ | ✅ | ✅ |
| Editable structured SOAP | ❌ | ✅ | ✅ |
| Intake templates | 1 | Unlimited | Unlimited |
| Intake submissions/month | 50 | Unlimited | Unlimited |
| Per-patient timeline + search | ❌ | ✅ | ✅ |
| PDF export of notes | Single note | Full timeline | Full timeline |
| Monthly Compliance Backup | ❌ | ❌ | ✅ |
| Practitioner seats | 1 | 1 | 3 (€59/each addl) |
| Secretary/admin seat | ❌ | ❌ | ✅ included |
| Practice analytics | ❌ | ❌ | ✅ |
| Support | Email 48h | Email+chat 24h | Priority 4h SLA |

### Overage pricing
- Extra SMS: **€0.12/SMS**, blocks of 100 (€11.90)
- Extra Scribe dictation: **€7.90/hour** (€0.80 per 5-min block)
- Extra practitioner seat (Premium): **€59/month annual** / **€79/month monthly**

### Variable cost reference (per session, dictation-only model)
- Whisper (4 min): ~€0.022
- GPT-4o SOAP merger: ~€0.014
- Reminder SMS to Greece: ~€0.05
- **Total marginal cost per session: ~€0.10**

### Free trial
**No free trial (decided session 11).** New practitioners default to `billing_status='unpaid'` and every `/dashboard/*` route except `/dashboard/billing` redirects to the billing page until they pick a plan. Stripe webhook flips them to `active` on subscription creation.

---

## 🎯 MAIN TODO — Pre-Launch & Commercialization

### Tier 0 — Carry-over from previous TODO

- [x] **Scribe error handler (Workflow #2)** — DONE (fully wired 2026-05-20). Two layers: (a) inline `onError=continueErrorOutput` on Download Audio / Whisper / GPT-4o routes failures to Mark Failed (Inline) → Log → Respond 500; (b) global `02c - Clinical Scribe Error Handler` catches anything else, PATCHes `scribe_status='failed'`, logs to `scribe_errors` table. SQL migration applied, workflow imported, Error Workflow setting linked on Workflow #2.
- [x] **Workflow #1 failsafe for missing patient phone** — DONE. Added `continueOnFail: true` on Create Patient + new **Resolve Patient ID** code node that safely merges both branches (found or created) before upsert. Appointments are now created even if patient creation fails or phone is missing. SMS still only sends if phone is present.
- [x] **Toggle Workflow #1 to Active** for hourly automatic sync (currently manual) — DONE

### Tier 1 — Commercialization blockers (must ship before any paid customer)

- [x] **myDATA integration Phase 1: Credential management (Session 6 — DONE)** — DECISION: Use ERP mode (Path A), NOT Provider certification (Path B)
  - **Architecture (ERP Mode):** Practitioner is legal issuer-of-record; BookFlow calls myDATA API with their credentials
  - **Completed (Phase 1):**
    - [x] Schema: enums `mydata_environment`, `vat_regime`; columns for username, VAT number, KAD code, address, regime; Supabase Vault encryption for subscription key
    - [x] SECURITY DEFINER functions for safe credential storage/rotation
    - [x] POST `/api/mydata/credentials` — verifies against AADE sandbox before persisting (RequestDocs read-only probe)
    - [x] GET `/api/practitioner-config` — fetch safe config view
    - [x] Settings UI: tabbed interface (General + myDATA tabs), rate_per_session_eur editable, myDATA credential entry with explicit authorization checkbox
    - [x] Audit log (mydata_audit_log table) — all attempts logged with redacted details
  - **Phase 2: Receipt submission workflow (Session 8–9 — COMPLETE & VERIFIED):**
    - [x] Workflow #5 rebuilt with AADE XML spec (invoiceType 11.2, VAT-exempt Article 22, E3_561_003 retail classification)
    - [x] Imported to n8n + published
    - [x] 17-node workflow: webhook → get context → decrypt RPC → guard (no key) → build XML → submit AADE → parse response → extract mark/errors → IF success/fail → update appointment + audit log → respond 200/500
    - [x] Dashboard `/api/appointments/[id]/issue-receipt` route verified (sends correct webhook payload)
    - [x] **Sandbox test COMPLETE (2026-05-25):** End-to-end receipt submission verified. Confirmed test appointment → Issued €50 receipt → AADE returned success statusCode with MARK → Appointment updated to mydata_status='submitted' → MARK displayed in dashboard badge → mydata_audit_log recorded
    - [x] **Three critical UX features added (Session 9):**
      - Manual "Mark attended" button (for appointments that happened but weren't confirmed via SMS link)
      - Manual "Mark cancelled" button (to reverse scheduled status)
      - Late-receipt warning when appointment_time > 12 hours ago (prevents AADE 24h transmission penalties)
      - Auto-flip stale pending (>90s) to failed status (prevents stuck "Submitting to AADE…" UI states)
      - "Reset & retry" button for stuck pending receipts (manual escape hatch)
    - [x] **Workflow #5 debugging & fixes (Session 9):**
      - Fixed Decrypt Subscription Key: responseFormat text (was json), added onError: continueErrorOutput
      - Fixed Build Receipt XML: added xmlns:icls namespace declaration, prefixed classification elements with icls: prefix (fixes AADE XMLSyntaxError 101)
      - Fixed Extract Result: rewrote to handle AADE's .NET <string> envelope wrapper, uses regex instead of XML parse
      - Fixed Log Failure to Audit: JSON.stringify all values, $if lazy evaluation for optional fields
      - Fixed docker-compose env var passthrough: N8N_RECEIPT_WEBHOOK_URL now passed to dashboard container
    - [ ] 24h deadline retry workflow (post-launch polish; manual retry button in UI for MVP)
  - **Why Tier 1:** By October 2026 myDATA becomes legal requirement for all B2B transactions. Not blocking onboarding (workaround: accountant submits), but essential for churn reduction and justifying €59–€119 pricing.
  - **Security:** Credentials encrypted at rest via Supabase Vault. Subscription key never logged. Explicit consent checkbox. Credentials scoped to practitioner row, not global.

- [x] **Calendar page** — `/dashboard/calendar` (Session 10 — DONE)
  - Day / Week / Month views, Week is default
  - URL-driven state (`?view=week&date=YYYY-MM-DD`) for shareable links + browser back/forward
  - Click an appointment → slide-out detail panel with workflow signals (intake/SOAP/receipt) and link to `/dashboard/appointments/[id]`
  - Status colors (scheduled=info, confirmed=accent, completed=muted, cancelled=danger w/ strikethrough)
  - Current-time line in day/week, today highlight in month, mobile defaults to day view
  - RLS-scoped fetch via `v_appointment_full`
  - Hand-built with Tailwind + native Date (no date-fns, no FullCalendar, no dnd-kit)
  - **Deferred:** drag-and-drop reschedule + inline-create both require GCal write integration; "+ New appointment" button intentionally disabled with tooltip
  - **Reality reconciled vs. original spec:** no `end_time` column → 50-min default block size; no `soap_note_id` / `receipt_id` / `sms_reminder_sent` booleans → derived from existing fields; UI is English-only by default but flips with the new locale toggle

- [ ] **Settings page expansion** — `/app/dashboard/settings`. General + myDATA tabs already shipped (Session 6/10). Remaining work scoped into 3 tiers (Session 13):

  **Tier 1 — Profile + Security + Notifications (in progress this session)**
  - [ ] **Profile tab** — editable name, email (triggers Supabase Auth re-verification), phone, `calendar_id`. PATCH `/api/practitioner-settings/profile`.
  - [ ] **Security tab** — change password (re-auth with current pw + `supabase.auth.updateUser({password})`). POST `/api/practitioner-settings/password`. Sign out of other sessions later (post-MVP).
  - [ ] **Notifications tab** — SMS reminder toggle, reminder offset hours (e.g. 24h before appointment), email digest toggle. PATCH `/api/practitioner-settings/notifications`. Migration `15_practitioner_notifications.sql` adds `sms_reminder_enabled BOOLEAN DEFAULT TRUE`, `reminder_offset_hours INT DEFAULT 24`, `email_digest_enabled BOOLEAN DEFAULT FALSE`. Workflow #1 reads these on the practitioner row before sending SMS.

  **Tier 2 — Power-user tweaks (deferred until Tier 1 ships)**
  - [ ] **Scribe preferences** — default dictation language (el/en) passed to Whisper, configurable soft-warn threshold (currently hardcoded 5min), modality hint that prefixes the GPT-4o SOAP prompt (e.g. "CBT therapist" vs "psychodynamic"). Stepping stone to full custom SOAP templates in Sprint 3.
  - [ ] **SMS template editor** — practitioner edits the Greek reminder copy + confirmation link wording. Workflow #1 currently hardcodes both. Store as `sms_reminder_template TEXT` on practitioners with sane default; render via `{patient_name}`, `{time}`, `{link}` placeholders.
  - [ ] **Working hours / availability** — practitioner sets weekly working hours; feeds into Calendar "outside hours" greying. Cheap migration (`working_hours JSONB`), unblocks the disabled "+ New appointment" button once GCal write integration lands.

  **Tier 3 — Compliance + danger zone (defer until GDPR pressure / churn signal)**
  - [ ] **Data export (GDPR)** — "Download all my data" button generates a signed-URL zip (appointments + patients + transcripts + SOAP notes as JSON + PDFs). Low frequency but legally useful in the EU.
  - [ ] **Danger zone** — cancel subscription (link to Stripe portal) + delete account (soft-delete: `status='inactive'`, scrub PII after 30d grace period).

- [x] **Plan-gating middleware (Session 11 — DONE)** — feature flags by tier on dashboard routes
  - `lib/plans.ts` — single source-of-truth for tiers, quotas (`QUOTAS`), feature flags (`FEATURES` 16 keys), tier-gated route prefixes (`ROUTE_TIER_GATES`), and helper predicates (`hasFeature`, `hasActivePlan`, `tierAtLeast`).
  - `proxy.ts` injects `x-pathname` into request headers so server components can read the current path via `headers()`. Auth redirect logic kept unchanged.
  - `app/dashboard/layout.tsx` fetches `plan_tier` + `billing_status` once per request, then: (a) redirects unpaid/cancelled users to `/dashboard/billing` (the only ungated path), (b) redirects tier-locked routes (e.g. future `/dashboard/analytics` for Premium) to `/dashboard/billing?upgrade=<feature>` if their tier is below the minimum.
  - `components/FeatureGate.tsx` — server component that takes a `feature` prop and either renders children, renders an in-page upgrade CTA card, or hides with `fallback="hide"`. Reads `practitioners.plan_tier` via Supabase RLS-scoped server client.
  - **No free trial** (decided this session). `supabase/14_remove_trial.sql` adds `unpaid` to the `billing_status` enum, switches the column default, and backfills any legacy `trial` rows. `trial_ends_at` column kept nullable but unused.
  - Billing page rewritten: dropped trial banner + trial-ends copy, added `billing.unpaid.*` prompt for new accounts and `billing.upgrade.*` prompt when redirected from a tier-gated route. Current plan card and usage cards hidden until they're on an active plan.
  - i18n: removed `billing.status.trial` / `billing.trialEnds`, added `billing.status.unpaid`, `billing.unpaid.{title,body}`, `billing.upgrade.{title,body}`, `featureGate.{title,body,cta}` in both `en` and `el`.

- [x] **Schema migration: subscription/billing fields on `practitioners`** — DONE. Created `supabase/08_billing.sql`. Adds enums `plan_tier` (essentials|professional|premium), `billing_status` (trial|active|past_due|cancelled), and columns `trial_ends_at`, `current_period_start`, `current_period_end`, `stripe_customer_id`, `stripe_subscription_id`, `billing_email`. Includes indexes for common queries and constraint that trial accounts must have a billing email.

- [x] **Usage metering view: `v_practitioner_usage_monthly`** — DONE. Created `supabase/09_usage_metering_view.sql`. View groups by practitioner + calendar month, returns `sms_sent_count` (from sms_log status='sent') and `scribe_minutes_used` (sum of audio_duration_seconds/60 from complete appointments). Foundation for quota enforcement and usage dashboards.

- [x] **Audio duration capture** — DONE. Created `supabase/07_add_audio_duration.sql` with new column. Updated Workflow #2's "Store Transcript" node to extract `duration` from Whisper response and PATCH appointment with `audio_duration_seconds = Math.round(duration)`. Now scribe usage metering is possible.

- [x] **Quota enforcement: Workflow #1 (SMS)** — DONE. Added 5 nodes to Practitioner Sync workflow: (1) Get Practitioner Tier — fetch plan_tier; (2) Get Monthly SMS Usage — query v_practitioner_usage_monthly; (3) Check SMS Quota — code node compares usage vs tier limit (essentials: 100, professional: 500, premium: 1500); (4) Is SMS Quota OK? — IF branch; (5) Log SMS Quota Exceeded — if over quota, log with status='quota_exceeded', skip Infobip send. Under quota: send SMS normally.

- [x] **Quota enforcement: Workflow #2 (scribe minutes)** — DONE. Added 6 nodes to Clinical Scribe workflow: (1) Get Practitioner Tier — fetch plan_tier; (2) Get Monthly Scribe Usage — query v_practitioner_usage_monthly; (3) Check Scribe Quota — code node compares usage vs tier limit (essentials: 30 min, professional: 600 min/10h, premium: 1800 min/30h); (4) Is Scribe Quota OK? — IF branch; (5) Set Scribe Quota Exceeded — if over quota, PATCH appointment; (6) Respond Quota Exceeded — return 429 with quota message. Under quota: continue to Whisper transcription normally.

- [x] **Per-session dictation cap (frontend)** — DONE. Added "Check Dictation Duration" node in Workflow #2 after Whisper transcription. Hard-rejects (throws error) if audio > 8 minutes (480 sec), soft-warns to console if > 5 minutes (300 sec). Rejects long dictations before expensive GPT-4o call. Prevents accidental hour-long uploads (phone left recording).

- [x] **GPT-4o context cap in Workflow #2 merger** — DONE. Updated "Get All Transcripts" node to add `&order=appointment_time.desc&limit=15` to Supabase query. Now fetches 15 most recent transcripts (in descending date order) instead of all sessions. Prevents unbounded token cost on long-term patients.

- [x] **Stripe integration (Session 4)** — IN PROGRESS. Built and tested:
  - [x] `dashboard/app/api/stripe/checkout/route.ts` — POST endpoint, creates Stripe checkout session for subscription (monthly/annual, all 3 tiers)
  - [x] `dashboard/app/api/stripe/webhook/route.ts` — POST endpoint, listens for customer.subscription.created/updated/deleted + invoice.payment_failed, updates practitioners table with plan_tier, billing_status, period dates, stripe IDs
  - [x] `dashboard/app/api/stripe/portal/route.ts` — POST endpoint, creates Stripe billing portal session for subscription management
  - [x] `dashboard/app/dashboard/billing/page.tsx` — Server component, displays current plan card (tier, status badge, renewal date), usage cards (SMS + Scribe with progress bars), PlanSelector component
  - [x] `dashboard/app/dashboard/billing/PlanSelector.tsx` — Client component, 3-plan cards (Essentials, Professional highlighted, Premium), monthly/annual toggle, checkout flow
  - [x] `dashboard/app/dashboard/billing/ManageButton.tsx` — Client component, opens Stripe portal
  - [x] `dashboard/package.json` — Added "stripe": "^16.11.0" dependency
  - **Live tested end-to-end (Session 12, 2026-05-27):** Full Stripe checkout flow ✓, webhook delivery + signature verification ✓, DB sync to `billing_status='active'` + plan_tier + period dates + Stripe IDs ✓, dashboard auto-unlock after webhook ✓, Stripe → app success redirect ✓. Plan switching and quota-enforcement-on-checkout still to verify, but the underlying transport works.

- [x] **Regenerate SOAP limiting (tier-based)** — DONE (2026-05-20)
  - **Tier limits:** Essentials: 25/month (~1.25 per session), Professional: 60/month (~3 per session), Premium: unlimited
  - **Schema:** Added `regenerate_soap_count` (int, default 0) + `regenerate_soap_reset_date` (date) to practitioners table (migration: `supabase/10_regenerate_soap_usage.sql`)
  - **Endpoint:** `POST /api/regenerate-soap` — Bearer token auth, validates user → practitioner, fetches `plan_tier`, checks/resets monthly counter, enforces quota, returns 429 if exceeded, else calls n8n webhook `https://n8n.bookflow.uk/webhook/regenerate-soap`, returns webhook response or error
  - **Stats endpoint:** `GET /api/practitioner-stats` — Returns `{ plan_tier, regenerate_soap_count, regenerate_soap_reset_date }` for authenticated user
  - **Monthly reset:** Lazy reset on first regenerate call after month boundary (checks if `regenerate_soap_reset_date < first of current month`)
  - **TranscriptEditor UI:**
    - Fetches practitioner stats on mount via `useEffect`
    - Shows "X/Y regens" badge next to Regenerate button
    - Badge color: muted (normal) → amber (80%+) → red (100%)
    - Premium shows "Unlimited regens" badge
    - Toast on success ("SOAP regenerated successfully!") or error (429 quota or webhook failure)
  - **Atomic increment:** Uses Supabase pessimistic increment to avoid race conditions

- [ ] **Usage dashboard surface (partial)**
  - [x] Billing page shows SMS and Scribe usage with progress bars, warnings at 80% and 100%
  - [ ] Settings page: more detailed usage breakdown, days left in billing period
  - [ ] Upgrade CTA overlay when over quota

- [x] **Single-note PDF export (Essentials feature)** — DONE (2026-05-20)
  - Created `GET /api/appointments/[id]/export-pdf` endpoint with Bearer token auth
  - Uses `pdf-lib` + `@pdf-lib/fontkit` for server-side PDF generation with full Unicode/Greek support
  - Reads Liberation Sans from system fonts (`/usr/share/fonts/liberation/LiberationSans-Regular.ttf`)
  - Fallback to DejaVu Sans if Liberation unavailable
  - Content: header "SOAP Note Export", patient name/ref, appointment date/time, raw transcript text (Greek or English)
  - Proper text wrapping with line height management
  - Footer with generation timestamp
  - File download: `SOAP_{patient_ref}_{YYYY-MM-DD}.pdf`
  - Endpoint verifies Bearer token → practitioner ownership → appointment exists
  - Returns 401 (unauthorized), 404 (not found), 403 (forbidden), or 500 on error
  - **Integration:** TranscriptEditor component has "Export PDF" button (alongside Edit & Regenerate buttons)
  - **Test verified:** Greek SOAP notes (Σ, Τ, Π, Ρ, Α, etc.) render correctly in exported PDFs

### Tier 2 — Professional tier specifics

- [ ] **Editable structured SOAP output**
  - Schema: add JSONB column `soap_structured` to patients with shape `{ subjective, objective, assessment, plan }`
  - Update GPT-4o prompt to return JSON via `response_format: json_object`
  - Dashboard UI: 4 editable text areas instead of one blob, save per field

- [ ] **Full-patient-timeline PDF export**
  - Extension of single-note PDF: includes patient demographics + all SOAP notes ordered by date

- [ ] **Full-text search across transcripts**
  - Postgres `tsvector` column on `appointments.raw_transcript`
  - Dashboard search bar that returns matching session snippets with patient context
  - Greek tokenization: use `unaccent` extension + `simple` text search config

- [ ] **Multiple intake templates**
  - Multiple Fillout forms (adult, adolescent, couples)
  - Schema: `practitioner_intake_templates` table → `{ practitioner_id, name, fillout_url, is_default }`

### Tier 3 — Premium tier specifics

- [ ] **Multi-seat practitioner management**
  - "Owner" practitioner can invite additional practitioners under same billing account
  - Schema: add `owner_practitioner_id` (self-FK on practitioners), `seat_role` enum (owner | clinician | admin)
  - Billing: 3 seats included in Premium, additional seats via Stripe metered billing at €59/month

- [ ] **Secretary/admin role with limited access**
  - New RLS policy: `seat_role='admin'` can SELECT from appointments + patients (basic fields only — no `raw_transcript`, no `merged_clinical_summary`)
  - Can INSERT to sms_log (send manual SMS), cannot view session transcripts/notes
  - Dashboard: admin sees calendar + patient contact, no clinical notes

- [ ] **Multi-calendar sync per practitioner**
  - `practitioner_calendars` table: `{ practitioner_id, calendar_id, label }`
  - Workflow #1 loops over all calendars per practitioner instead of one `calendar_id`

- [ ] **Monthly Compliance Backup** (headline Premium feature)
  - New scheduled n8n Workflow #5: monthly trigger, for each Premium practitioner, export all data (appointments + patients + SOAP notes + transcripts) as JSON + PDFs into a ZIP
  - Encrypt the ZIP with practitioner-set password
  - Email delivery branded: *"Το Μηνιαίο Αντίγραφο Ασφαλείας Συμμόρφωσης BookFlow"*
  - Log delivery in `compliance_backup_log` table
  - **Positioning:** market as data sovereignty / GDPR compliance, NOT as "export & leave"

- [ ] **Practice analytics dashboard**
  - New page `/dashboard/analytics` (Premium only)
  - Charts: no-show rate over time, session volume per month, scribe usage per practitioner, revenue tracking (`total_sessions × per-session rate` — practitioner inputs their rate)

### Tier 4 — Overage & billing polish

- [ ] **Overage tracking**
  - When SMS or scribe usage exceeds plan cap, increment `overage_sms_count` and `overage_scribe_minutes` on practitioners for current period
  - At period end, Stripe invoice adds line items: SMS overage (blocks of 100 @ €11.90), Scribe overage (hourly @ €7.90)

- [ ] **Pre-overage email warning**
  - At 80% quota: email "You're approaching your monthly limit"
  - At 100%: email "You've hit your limit — buy a block or upgrade"

### Sprint Completion

**✅ Sprint 1 — Make existing system bill-able:** COMPLETE (ended 2026-05-18)
- ✅ Audio duration capture (Workflow #2 stores `audio_duration_seconds`)
- ✅ Billing schema (`plan_tier`, `billing_status`, Stripe IDs on practitioners)
- ✅ Usage metering view (`v_practitioner_usage_monthly`)
- ✅ SMS quota enforcement (Workflow #1 checks limits: essentials 100, professional 500, premium 1500)
- ✅ Scribe quota enforcement (Workflow #2 checks limits: essentials 30min, professional 600min, premium 1800min)
- ✅ GPT-4o context cap (limits SOAP merger to 15 most recent transcripts)
- ✅ Dictation duration cap (rejects audio > 8min, warns > 5min)
- ✅ Scribe error handler (dual-layer: inline + global error workflow)
→ **Status:** System is now bill-able. BUT: **myDATA integration (Tier 0) is BLOCKING paid customer onboarding in Greece.** Cannot legally invoice without it.

**🚀 Sprint 2 — UI Overhaul + Stripe integration + Quota & PDF Export + myDATA:** COMPLETE (session 6)
- ✅ Design system overhaul (light/dark theme, teal accent, responsive Tailwind)
- ✅ Sidebar navigation + topbar with theme toggle
- ✅ Password recovery flow (forgot-password, reset-password pages)
- ✅ Billing dashboard page (usage cards, plan selector)
- ✅ Stripe checkout integration (`/api/stripe/checkout`)
- ✅ Stripe webhook handler (`/api/stripe/webhook`)
- ✅ Stripe portal integration (`/api/stripe/portal`)
- ✅ **Regenerate SOAP limiting** — POST `/api/regenerate-soap` + GET `/api/practitioner-stats` endpoints
- ✅ **Single-note PDF export** — GET `/api/appointments/[id]/export-pdf` with pdf-lib + fontkit
- ✅ **myDATA Phase 1** — Supabase Vault encryption, Settings tabbed UI (General + myDATA), credential verification, `rate_per_session_eur` editable (default €50)
- ✅ **myDATA Phase 2** — Appointment detail page with receipt issuance UI, IssueReceiptModal, POST `/api/appointments/[id]/issue-receipt`, Workflow #5 specification (step-by-step guide ready for n8n build)
- ✅ **myDATA Phase 2 — Workflow #5 rebuilt & verified (session 8–9):** Imported to n8n, AADE XML spec (invoiceType 11.2, VAT-exempt Art. 22), published. **Sandbox test COMPLETE:** €50 receipt submitted to AADE sandbox, MARK returned and stored in database, audit log recorded. All integration points verified end-to-end.
- [ ] **Plan-gating middleware (feature flags by tier)** — NEXT. Blocks by tier on dashboard routes, trial flow (14d Professional), feature visibility by plan.
→ **Target:** Public Essentials signup with Greek tax e-receipts, real money flowing

**Sprint 3 — Unlock Professional:** editable structured SOAP, full timeline PDF, full-text search, multiple intake templates, overage tracking.
→ End: existing Essentials customers can upgrade.

**Sprint 4 — Unlock Premium:** multi-seat management, secretary role, multi-calendar sync, Monthly Compliance Backup, practice analytics.
→ End: full pricing menu live, clinic sales unlocked.

---

## 🚀 IMMEDIATE NEXT STEPS (Session 13 → 14)

Settings Tier 1 + Workflow #1 notification wiring shipped (Session 13). All built locally, **not yet verified live** — see Pending Verification at the bottom of this section.

1. **Settings Tier 2 — SMS template editor** (recommended next, small)
   - Practitioner edits the Greek reminder copy + confirmation link wording. Workflow #1 currently hardcodes both.
   - Schema: add `sms_reminder_template TEXT` to `practitioners` with sane default; render via `{patient_name}`, `{time}`, `{link}` placeholders.
   - Compounds with the notification wiring just done — same Workflow #1 area, same Settings page area.

2. **FeatureGate the longitudinal SOAP merge** (~20 min cleanup)
   - Wrap merged-SOAP block on patient detail page with `<FeatureGate feature="longitudinalMerge">` so Essentials sees the upgrade CTA. UI honesty fix.
   - When structured SOAP / timeline PDF / full-text search land, gate them with the matching feature keys already declared in `lib/plans.ts`.

3. **Open Sprint 3 — Professional tier unlock**
   - Editable structured SOAP (JSONB `soap_structured`, four fields instead of one blob)
   - Full-text search across transcripts (Postgres `tsvector` + `unaccent` for Greek)
   - Full-patient-timeline PDF export
   - Multiple intake templates

4. **Production launch prep**
   - Switch Stripe from test → live keys, register live webhook with correct signing secret
   - Rebuild the marketing landing page (bookflow.uk)
   - Onboard a second test practitioner end-to-end

### Pending verification (Session 13 deferred)
- Run `supabase/15_practitioner_notifications.sql` in Supabase SQL editor.
- `docker-compose up -d --build dashboard` to ship the 5-tab settings page.
- Open Workflow #1 in n8n → Import from File → pick the updated `workflow.json` → Save → Activate.
- Walk through each new tab: edit profile, change password, flip SMS toggle, change offset to e.g. 48h. Verify next hourly tick respects the toggle (no Infobip call when disabled) and uses the new window.

---

## ✅ COMPLETED IN SESSION 13 (2026-05-27)

**Settings page Tier 1 shipped + Workflow #1 wired to read notification preferences.** Pre-launch polish from the Session 12 → 13 plan, item 1.

**Settings expansion planned in 3 tiers** (documented in TODO):
- **Tier 1** (this session) — Profile + Security + Notifications tabs
- **Tier 2** (next) — Scribe preferences, SMS template editor, working hours
- **Tier 3** (later) — GDPR data export, danger zone (cancel + delete account)

**Tier 1 delivered:**
- **Profile tab** ([ProfileTab.tsx](dashboard/app/dashboard/settings/ProfileTab.tsx)) — editable name, email, phone, calendar_id. Email change goes through `admin.auth.admin.updateUserById` which triggers Supabase's verification email flow; practitioners row mirrors the new email only after the auth call succeeds.
- **Security tab** ([SecurityTab.tsx](dashboard/app/dashboard/settings/SecurityTab.tsx)) — change password with current-password re-auth. The route ([password/route.ts](dashboard/app/api/practitioner-settings/password/route.ts)) signs in on a *separate* anon client to verify the current password without disturbing the caller's session, then uses the service-role admin client to set the new one.
- **Notifications tab** ([NotificationsTab.tsx](dashboard/app/dashboard/settings/NotificationsTab.tsx)) — toggles for SMS reminders, configurable reminder offset in hours (1–168, default 24), and email digest (the digest worker itself is not built; the toggle persists for when it ships). The offset input is disabled when the SMS toggle is off.
- **API routes added:**
  - [PATCH /api/practitioner-settings/profile](dashboard/app/api/practitioner-settings/profile/route.ts)
  - [POST /api/practitioner-settings/password](dashboard/app/api/practitioner-settings/password/route.ts)
  - [PATCH /api/practitioner-settings/notifications](dashboard/app/api/practitioner-settings/notifications/route.ts)
- **SettingsTabs** ([SettingsTabs.tsx](dashboard/app/dashboard/settings/SettingsTabs.tsx)) now renders 5 tabs (General / Profile / Security / Notifications / myDATA) with `overflow-x-auto` for mobile. Settings page fetches the extra fields server-side via `practitioners` table (alongside the existing `v_practitioner_mydata_config` view).
- **Tab UI:** dropped the underline style in favour of pill-style buttons using the existing `bf-nav-link` class — same hover/active treatment as the Sidebar (100ms transition, `--surface-2` hover, `--accent-soft` active background). One consistent interaction language across the shell. Added `cursor: pointer` to `.bf-nav-link` in `globals.css` because Tailwind preflight resets `<button>` to `cursor: default` — sidebar wasn't affected (it uses `<Link>` anchors).
- **i18n:** ~40 new keys in en + el dictionaries, covering all three tabs.

**Migration:** `supabase/15_practitioner_notifications.sql` adds three columns to `practitioners`:
- `sms_reminder_enabled BOOLEAN NOT NULL DEFAULT TRUE`
- `reminder_offset_hours INT NOT NULL DEFAULT 24` (CHECK 1–168)
- `email_digest_enabled BOOLEAN NOT NULL DEFAULT FALSE`

**Workflow #1 wired to read new fields** (Option A — variable window):
1. *Get Active Practitioners* `select` extended with `sms_reminder_enabled,reminder_offset_hours`.
2. *Get Events ~24h Ahead* `timeMax` is now `$now.plus({hours: $json.reminder_offset_hours || 24}).toISO()` — each practitioner gets their own forward-look window. `|| 24` fallback keeps any unmigrated row on legacy behaviour.
3. *Should Send SMS?* IF node gains a third AND condition: `$('Split Practitioners').item.json.sms_reminder_enabled !== false`. Toggling off silently bypasses the Infobip branch (no `sms_log` skipped-row written — keeps the table noise-free).

**Behaviour after migration + workflow re-import:**
- Toggle off → no SMS for that practitioner's appointments.
- Offset = 24 → exactly today's behaviour preserved.
- Offset = 72 → patients can be reminded up to 72h in advance; the existing `sms_log` status='sent' dedup prevents resending on later hourly ticks.

**Files touched:**
- `supabase/15_practitioner_notifications.sql` (new)
- `dashboard/app/dashboard/settings/page.tsx`
- `dashboard/app/dashboard/settings/SettingsTabs.tsx`
- `dashboard/app/dashboard/settings/{ProfileTab,SecurityTab,NotificationsTab}.tsx` (new)
- `dashboard/app/api/practitioner-settings/{profile,password,notifications}/route.ts` (new)
- `dashboard/lib/i18n/dictionary.ts` (~40 new keys × 2 locales)
- `dashboard/app/globals.css` (cursor: pointer on `.bf-nav-link`)
- `n8n-workflows/01-practitioner-sync/workflow.json`

**Verified locally:** `tsc --noEmit` silent, `next build` clean, all routes registered. **Not yet verified live** — deferred to a dedicated testing pass:
- Run `15_practitioner_notifications.sql` in Supabase
- `docker-compose up -d --build dashboard`
- Re-import Workflow #1 into n8n and re-activate
- Walk through each tab + flip the SMS toggle + wait for the next hourly tick

**New gotcha worth remembering:**
- Tailwind preflight resets `<button>` to `cursor: default`. Anchors (`<Link>`) keep `cursor: pointer` automatically. When sharing a class between buttons and anchors (e.g. `bf-nav-link`), set `cursor: pointer` on the class explicitly, and override with `[aria-disabled='true']` for locked states.
- Supabase email change via `admin.auth.admin.updateUserById({ email })` triggers a verification flow — sign-in still uses the *old* email until the user confirms the link sent to the new address. Mirror the new email to `practitioners.email` only *after* the auth update returns success; otherwise you have a row pointing at an unverified address.

---

## ✅ COMPLETED IN SESSION 12 (2026-05-27)

**Stripe end-to-end verified live** — first real test of the checkout → webhook → DB sync → dashboard unlock path. Two production bugs found and fixed along the way.

**Test flow walked end-to-end:**
1. Reset Dr. Meimaris to `billing_status='unpaid'` (sidebar locked, all nav items except Billing greyed out — confirms Session 11 plan-gating renders correctly)
2. Drove checkout from `/dashboard/billing` → Stripe Checkout (€588 annual Essentials, test card 4242…)
3. Payment succeeded, Stripe customer + subscription created with correct metadata (`practitioner_id`, `plan_tier`, `billing_period`)
4. Stripe webhook delivered to `https://app.bookflow.uk/api/stripe/webhook`, handler updated practitioners row to `billing_status='active'`, dashboard unlocked on next refresh
5. Success redirect from Stripe Checkout lands back on `/dashboard/billing?checkout=success`

**Bug #1 — `STRIPE_WEBHOOK_SECRET` mismatch:**
- Symptom: webhook arrived at `/api/stripe/webhook` but signature verification threw `No signatures found matching the expected signature for payload`.
- Cause: the secret in `.env` was from a different/earlier webhook endpoint than the one Stripe was actually delivering to. Each webhook endpoint in Stripe has its own signing secret.
- Fix: revealed the signing secret on the active webhook endpoint in Stripe dashboard, pasted it into `.env`, `docker-compose up -d --force-recreate dashboard`.
- Gotcha to remember: there's no way to tell from inspecting `.env` whether the secret matches the *active* endpoint — you have to compare against whatever Stripe shows on the destination page right now.

**Bug #2 — Stripe API field migration broke the webhook handler:**
- Symptom: signature verified OK, but handler crashed with `RangeError: Invalid time value` from `Date1.toISOString` while processing `customer.subscription.updated`.
- Cause: in API version `2026-04-22.dahlia` (the one this Stripe account is on), `current_period_start` and `current_period_end` are no longer fields on the `Subscription` object — they moved to the **subscription item** (`subscription.items.data[0]`). Old code did `new Date(subscription.current_period_start * 1000).toISOString()` which became `new Date(undefined * 1000).toISOString()` → invalid date → throw.
- Fix: added a `getPeriod(sub)` helper at the top of `route.ts` that reads from `subscription.items.data[0].current_period_start/end` with a fallback to the legacy field, returns `null` if neither is a number. Update handlers skip period fields if null instead of forcing them.
- Bonus fix during the same edit: `customer.subscription.updated` now flips `billing_status='cancelled'` when `subscription.status === 'canceled'`. Previously only `active` and `past_due` were handled, so a portal cancel-now would land in the DB without updating billing_status until the eventual `customer.subscription.deleted` event.

**Verified working:**
- Webhook signature verification ✓
- `customer.subscription.created` → activates practitioner with period dates from subscription items
- `customer.subscription.updated` (status: canceled) → flips to `cancelled`
- `customer.subscription.deleted` → flips to `cancelled`
- Manual DB reset SQL (set billing_status='unpaid', null Stripe IDs) for re-testing

**Files touched:**
- `dashboard/app/api/stripe/webhook/route.ts` (getPeriod helper + canceled status handling)
- `.env` (STRIPE_WEBHOOK_SECRET corrected, STRIPE_SECRET_KEY added)
- `docker-compose.yml` (already had env var passthrough from session 9; no change needed)

---

## ✅ COMPLETED IN SESSION 9 (2026-05-25)

**Workflow #5 sandbox test:** End-to-end myDATA receipt submission verified
- Confirmed test appointment in dashboard
- Issued €50 receipt via IssueReceiptModal
- n8n Workflow #5 executed ~5 sec, no errors
- AADE sandbox returned success statusCode + invoiceMark
- Appointment updated to mydata_status='submitted' with MARK displayed
- Dashboard immediately refreshed via router.refresh()
- mydata_audit_log recorded success row

**Three critical UX features (blocking manual receipt flow):**
1. **Mark Attended** button — unconfirmed appointments can now be marked attended after the fact (POST `/api/appointments/[id]/status`)
2. **Mark Cancelled** button — cancel scheduled appointments (POST `/api/appointments/[id]/status`)
3. **Late-receipt warning** — red alert if appointment_time > 12 hours ago (prevents AADE 24h penalties)
4. **Auto-flip stale pending** — appointments stuck at "Submitting to AADE…" for >90s auto-flip to failed (allows retry)
5. **Reset & retry button** — manual escape hatch to clear stuck pending state (POST `/api/appointments/[id]/reset-receipt`)

**Workflow #5 debugging & fixes:**
- Decrypt Subscription Key: fixed responseFormat (text), added onError: continueErrorOutput routing
- Build Receipt XML: added icls namespace (xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0"), prefixed classification elements
- Extract Result: rewrote regex-based parsing to handle AADE's .NET <string> envelope
- Log Failure to Audit: JSON.stringify all values, $if() lazy evaluation
- Docker-compose: added env var passthrough for N8N_RECEIPT_WEBHOOK_URL and other secrets

**Database migration:**
- Created `supabase/12_mydata_pending_at.sql` with mydata_pending_at TIMESTAMPTZ column (tracks when pending state started, enables stale detection)

---

## ✅ COMPLETED IN SESSION 10 (2026-05-26)

**Calendar page (`/dashboard/calendar`):**
- New route: Day / Week / Month views, Week is default, mobile defaults to Day
- URL state via `?view=` and `?date=YYYY-MM-DD` so prev/next preserves browser back-forward + shareable links
- Server fetch via `v_appointment_full` over the visible window (RLS-scoped)
- Side panel slides out on appointment click — shows time, status, workflow signals (intake ✓ / SOAP ✓ / receipt ✓), links to full `/dashboard/appointments/[id]` and patient profile
- Current-time line in Day/Week, today highlight in Month, status-coded blocks (scheduled=info, confirmed=accent, completed=muted, cancelled=danger strikethrough)
- Hand-built with Tailwind + native `Date` — no date-fns, no FullCalendar, no @dnd-kit. 50-min `SESSION_MINUTES` constant for block height (no `end_time` column yet)
- "+ New appointment" intentionally disabled with tooltip — GCal is still the source of truth via Workflow #1
- 9 files in `dashboard/app/dashboard/calendar/` (utils, page, Calendar, CalendarHeader, DayView, WeekView, MonthView, AppointmentBlock, AppointmentPanel, loading)

**Dashboard i18n — Greek/English language toggle (Phase A + Phase B):**
- New DB column `practitioners.locale` TEXT NOT NULL DEFAULT 'el' CHECK IN ('en','el') — migration `supabase/13_locale.sql`
- `lib/i18n/` package:
  - `dictionary.ts` — ~210 typed keys, English is source-of-truth, Greek must match keys exactly; `translate(locale, key, vars?)` supports `{name}` interpolation
  - `server.ts` — `getLocale()` reads `bf_locale` cookie first, falls back to `practitioners.locale` DB lookup, then DEFAULT_LOCALE; `getT()` returns `{locale, t, bcp}` for server components
  - `client.tsx` — `LocaleProvider` (mounted at root layout so it covers auth pages) + `useT()` hook returning the same shape
- `POST /api/practitioner-settings/locale` writes DB + mirrors to `bf_locale` cookie (path=/, 1y, sameSite=lax) so SSR doesn't need a DB hit
- Settings → General has a new "Language" segmented control (English / Ελληνικά) above session rate, optimistic UI, `router.refresh()` on save
- Root `<html lang>` flips dynamically per locale
- **Every dashboard surface translated** (Phase B):
  - Sidebar nav labels + user chip fallback
  - Settings: page header, tab labels, GeneralTab (rate + language), MyDataTab (every field label, placeholder, KAD code option, consent text, error messages)
  - Calendar: header, view toggle, day names, current-time-relative copy, empty state, slide-out panel signals/buttons, status labels
  - Patients: list (KPIs, empty state, intake badge, count pluralization) + detail (header, mini-stats, SOAP section title, appointments list, status/scribe badges) + RegenerateSoapButton (button states, toast messages, quota counter, tooltip)
  - Appointments detail: header, session notes block, transcribing/empty states, patient sidebar, StatusActions (Mark Attended / Cancelled + confirm dialog), TranscriptEditor (edit/save/cancel/export PDF + toast messages), IssueReceiptModal (title, amount help, late-receipt warning with `{hours}` interpolation, cancel/submit), ReceiptSection (status badges, reset flow, retry copy)
  - Billing: page (header, current plan, trial/renews, usage cards with `{pct}%` interpolation, plan-list subtitle), PlanSelector (plan names, taglines, all features mapped to translation keys, period toggle, "Save 17%", current/loading/switch/choose button states, error fallbacks), ManageButton
  - Auth: Login (welcome copy, fields, friendlyError mapped to translation keys), Forgot password (idle/sent states, "try again", checkInbox interpolation), Reset password (invalid-link/done/form states, min-length/mismatch errors)
  - Top bar: LogoutButton ("Sign out"), ThemeToggle (aria-label)
- All `toLocaleString` / `toLocaleDateString` calls now use the `bcp` value (`el-GR` or `en-GB`) so weekday/month names flip with the toggle
- Existing English Supabase server error messages left untranslated — they're swallowed by translated client fallbacks in practice
- Patient-facing `/confirm/*` pages remain Greek-only by design (their audience is patients, not the practitioner)
- Build green: `tsc --noEmit` silent, `next build` succeeds, all routes register including `/api/practitioner-settings/locale`. Login/Forgot/Reset moved from static prerender to dynamic — expected, since they now consult the locale cookie per request.

---

## 🎯 FINISH TIER (on demand only)

Tasks to complete only when explicitly requested:

- [ ] **Test Stripe checkout flow end-to-end** — full checkout, webhook delivery, plan switching, quota enforcement
- [ ] **Rebuild bookflow.uk marketing landing page**
- [ ] **Test full flow with a second practitioner** — multi-practitioner validation

---

## 📦 FUTURE UPDATES — Parked / Nice-to-Have

Features that came up during pricing strategy but were intentionally deferred.

### Parked clinical features
- [ ] **Custom SOAP templates by modality** — CBT vs psychodynamic vs systemic structures. Single template works for v1; revisit at 50+ practitioners asking for it.
- [ ] **Treatment plan auto-generation** — GPT-generated treatment plans after N sessions. Deferred due to clinical risk (a wrong plan is dangerous) — needs prompt safety + disclaimers before shipping.
- [ ] **Clinical risk flagging** — AI scans transcripts for suicidal ideation / self-harm language. **Legal liability concern** — do not build without healthcare lawyer review. Missing a flag could create liability exposure.
- [ ] **Pre-session questionnaires** (PHQ-9, GAD-7, custom Greek scales) with automated scoring
- [ ] **Outcome tracking dashboards** — patient progress over time on scored scales

### Parked operational features
- [ ] **Two-way SMS / patient self-rescheduling** — blocked by Infobip outbound-only on Greek leg. Possible alternative: web form on `app.bookflow.uk/reschedule/[id]` that the SMS confirmation link could point to. Defer until clear demand.
- [ ] **Waitlist auto-fill** — too operationally complex for solo Greek practices who don't run real waitlists. Revisit only for the multi-clinic segment.
- [ ] **Viber Business reminders** — Infobip supports Viber but minimum €150/month sender ID commitment to Greece makes this non-economic unless multiple Premium clinics use it.
- [ ] **Email reminders alongside SMS** — additional touch point; low cost to add via Infobip Email or SendGrid.

### Parked AI / scribe enhancements
- [ ] **Higher-quality model option** (GPT-5.4 or successor for complex cases) — wait until pricing stabilizes and clinicians explicitly ask for it.
- [ ] **Goal tracking across sessions** — AI extracts and tracks therapeutic goals over time.
- [ ] **Custom prompt builder UI** — let practitioners define their own SOAP prompt structures.

### Parked exports / integrations
- [ ] **Bulk single-format exports** (e.g., "all SOAP notes for patient X as one PDF for referral letter")
- [ ] **Insurance billing integration** — Greek insurance funds (ΕΟΠΥΥ, etc.) — complex regulatory build, low priority for cash-pay private practice market.
- [ ] **Doctoranytime integration** — sync calendar both ways with Doctoranytime marketplace. Could be a Premium-tier differentiator if Doctoranytime offers API access.

### Parked dashboard / UX
- [ ] **Tagging & categorization** of patients (by presenting issue, treatment phase)
- [ ] **Calendar view inside dashboard** (currently relying on Google Calendar UI itself)
- [ ] **Native iOS/Android apps** — currently PWA. Revisit at 200+ paying users.

### Parked architecture / infra
- [ ] **Move from self-hosted Docker to managed infra** when crossing 50 paying users (current setup is fragile single-point-of-failure)
- [ ] **Database backup automation** beyond Supabase's built-in (off-site encrypted snapshots)
- [ ] **n8n workflow version control** — workflow JSONs should live in `n8n-workflows/` directory and be exported regularly
- [ ] **Monitoring + alerting** (Sentry for dashboard errors, n8n execution failures → email/Slack)

---

## Pending Design Decisions (Post-Testing)

**Regenerate SOAP limiting (Session 4 — DECIDED)** — Practitioners can manually re-run GPT-4o SOAP merger on existing transcripts to fix missed words or refine notes. At €0.014 per call, cost is negligible; limits exist to prevent abuse, not protect margin.

**Tier-specific limits (DECIDED 2026-05-19):**
| Tier | Monthly Regenerations | Per-Session (20 sessions/month) |
|---|---|---|
| **Essentials** | **25** | ~1.25 regens per session |
| **Professional** | **60** | ~3 regens per session |
| **Premium** | **Unlimited** | Full freedom |

**Rationale:**
- Essentials: Covers 1–2 refinements per session to catch transcription gaps. Enough freedom without feeling unlimited.
- Professional: Covers iterative refinement and experimentation with SOAP structure. Active clinicians rarely hit limit.
- Premium: Multi-practitioner clinics get full freedom. Also positions regeneration as a Professional-tier upgrade selling point.

**Implementation (next sprint):**
1. Add `regenerate_soap_count` (integer, resets monthly) + `regenerate_soap_reset_date` (date) to practitioners table (or new `regeneration_usage` tracking table)
2. Build `POST /api/regenerate-soap` endpoint with quota enforcement
3. Update TranscriptEditor UI to show remaining regenerations badge
4. Warning at 80% usage, 100% shows "Upgrade to Professional" CTA
5. Webhook to GPT-4o only fires if quota available; else return 429 with "You've used all regenerations this month"

---

## Gotchas to Remember

- **i18n source-of-truth is the English dict.** `dictionary.ts` exports `en` as `const`, derives `TranslationKey = keyof typeof en`, then types `el: Dictionary` against it. If you add a key to one dict and forget the other, TypeScript catches it at build. Never add a Greek-only or English-only key.
- **i18n cookie name is `bf_locale`** and is set by `/api/practitioner-settings/locale` with `path=/, sameSite=lax, maxAge=1y`. SSR reads cookie first via `getLocale()`, falls back to `practitioners.locale` DB lookup, then to `DEFAULT_LOCALE='el'`. Never read the cookie directly in components — always go through `getLocale()` / `getT()` (server) or `useT()` (client).
- **`LocaleProvider` is at the root layout**, not the dashboard layout. This is intentional so `/login`, `/forgot-password`, `/reset-password` can use `useT()`. Do not re-wrap children in `LocaleProvider` inside nested layouts — it just creates a redundant context.
- **Server pages that render badges/helpers** (e.g. `StatusBadge`, `ScribeBadge`, `IntakeBadge`) must pass the *translated* label down as a prop. The helpers themselves stay locale-agnostic — keeps the components reusable and avoids forcing them client-side just to call `useT()`.
- **Always pass `bcp` to `toLocaleString` / `toLocaleDateString` / `toLocaleTimeString`.** Never hard-code `'el-GR'` or `'en-GB'`. Get `bcp` from `getT()` (server) or `useT()` (client). The whole point of the toggle is that date formatting flips with the rest of the UI.
- **Pluralization is not built in** — handle it in the caller (e.g. Patients list uses `patients.list.count.one` vs `patients.list.count.other` based on `total === 1`). Don't try to encode plural rules into the dictionary.
- n8n HTTP nodes auto-split arrays; empty array results get silently dropped unless `alwaysOutputData=true` is set.
- Infobip phone format: `306979244944` — no `+`, spaces, or dashes. Parse Event normalises this.
- Infobip Greek SMS is **outbound only** — no two-way SMS. Use confirmation links instead.
- Fillout sends audio as `{url, name, ...}` object — Parse Webhook extracts `.url`.
- Transcribe Whisper node: Input Data Field Name must be `data`, credential must be `OpenAI API`.
- GPT-4o node credential must be `OpenAI API` (not Supabase).
- `app.bookflow.uk/confirm/<id>` is the SMS confirmation link (Next.js server action, not n8n).
- `total_sessions` increments via DB trigger on appointment status → confirmed.
- Scribe is for **post-session dictation** (2-5 min of notes), NOT full-session recording. This is the product positioning — don't drift.
- **Greek PDF generation (CRITICAL):** jsPDF cannot handle Greek Unicode — WinAnsi encoding mode fails silently on Greek chars. **Solution:** Use `pdf-lib` + `@pdf-lib/fontkit` + system fonts (Liberation Sans or DejaVu). FontKit MUST be registered with `PDFDocument.registerFontkit(fontkit)` before embedding custom fonts. System font paths in Alpine Linux: `/usr/share/fonts/liberation/LiberationSans-Regular.ttf` or `/usr/share/fonts/dejavu/DejaVuSans.ttf`. RGB colors must be 0-1 range, not 0-255. Do NOT use jsPDF for Unicode text.
- **Theme persistence:** ThemeScript runs before React hydration. If script is removed or broken, pages will flash light mode briefly on dark mode users. Keep it in layout root.
- **Stripe API version:** Dashboard code pins `'2024-06-20'` but the **account itself** auto-upgrades and webhooks arrive shaped according to the account's current API version (we're seeing `2026-04-22.dahlia` events). If upgrading Stripe package, update API version in both `checkout` and `webhook` route files — but be aware webhook payload shape can shift independently of your code's pinned version.
- **`current_period_start` / `current_period_end` are on the subscription item, NOT the subscription** (since API version `2026-04-22.dahlia`). Read them from `subscription.items.data[0].current_period_start/end`. The webhook handler has a `getPeriod()` helper that does this with a fallback to the legacy subscription-level fields. Burned us in session 12 — handler crashed with `RangeError: Invalid time value` because `new Date(undefined * 1000).toISOString()` throws.
- **`STRIPE_WEBHOOK_SECRET` is per-endpoint, not per-account.** Each webhook destination in Stripe has its own signing secret. If you create / recreate / re-import a webhook endpoint, the secret changes and `.env` must be updated. There's no way to verify the secret is correct without comparing against the live endpoint page — failed verifications show as `No signatures found matching the expected signature for payload`.
- **`customer.subscription.updated` can carry `status='canceled'`** (Stripe portal "cancel now" path) — not just `customer.subscription.deleted`. The webhook handler must check status inside the updated event, otherwise a portal cancel won't flip `billing_status='cancelled'` until the eventual deletion event fires.
- **Stripe webhook events:** Webhook only fires if events are configured in Stripe dashboard. Must have: `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.
- **Billing status syncing:** After Stripe checkout, webhook event updates `practitioners.plan_tier`, `billing_status`, `stripe_customer_id`, `stripe_subscription_id`, `current_period_start`, `current_period_end`. Quota enforcement in API routes checks these values. Plan-gating features (UI visibility) not yet implemented — TODO in plan-gating middleware task.
- **Billing page logic:** Current plan determined by `billing_status='active' && plan_tier`. Trial users (billing_status='trial') see plan selector but no "Current plan" badge.
- **Usage metering window:** `v_practitioner_usage_monthly` view uses `period_start` (calendar month). Quota resets on 1st of each month, not on subscription renewal date.
- **myDATA API has two integration paths.** BookFlow uses ERP mode (Path A) where the psychologist is legal issuer-of-record and BookFlow calls the API with their credentials. Do NOT pursue Provider certification (Path B) — too much liability for solo-founder SaaS.
- **myDATA credentials = full tax API access.** Treat with same care as banking credentials. Encrypt at rest, never log, explicit consent flow at entry.
- **Greek psychologist KAD codes:** typically `869039` (Λοιπές υπηρεσίες ανθρώπινης υγείας) or `869014` (Υπηρεσίες ψυχολόγου). Verify with practitioner's accountant during onboarding.
- **VAT exemption is the default for clinical psychology** under Article 22 of the Greek VAT Code, but NOT for organizational/HR consulting work some psychologists also do. Onboarding wizard must ask explicitly.
- **AADE 24-hour transmission deadline.** Receipts must be transmitted to myDATA within 24h of issuance. Late = €150+ penalty. Build retry logic that exhausts well within 24h window.
- **Greek font in PDFs (already flagged but doubly important for myDATA):** receipts WILL fail Greek-character tests if you use default system fonts. Test with `@react-pdf/renderer` + a known Greek-compatible font (Noto Sans, Roboto, or DejaVu) from day one.
- **myDATA subscription key is a credential, not a password.** Treat it like a banking API key — encrypt at rest, never log, never expose to stderr. Supabase Vault stores it; RPC functions return only to service-role client.
- **AADE sandbox vs production endpoints differ.** Sandbox: `https://mydataapidev.aade.gr`; Production: `https://mydatapi.aade.gr/myDATA/`. Practitioner chooses at onboarding via `mydata_environment` toggle. Defaulting to sandbox is safe.
- **RequestDocs read-only probe (GET with mark=0) is the safest credential verification.** No data mutation, just confirms username + subscription key work. Used in `/api/mydata/credentials` before persisting anything.
- **Receipts must transmit within 24 hours.** AADE deadline = 150+ EUR penalty per late receipt. Build retry logic (Workflow #5) that exhausts retries well before 24h, with escalation email to practitioner if deadline passes.
- **Rate per session (rate_per_session_eur) is editable anytime** in Settings → General. Receipts use the rate at the time of issuance (not the appointment date). Practitioner can change it daily without breaking audit trail.
- **VAT regime = mixed requires two-step Workflow #5 logic:** on appointment confirm, check if the appointment maps to a taxable service category (e.g., consulting vs clinical psych). If mixed-VAT practitioner, flag which VAT rate applies to that receipt. Initial implementation: all appointments are clinical (exempt); revisit if practitioner adds secondary income categories.

### Workflow #5 (myDATA Receipt Submission) Key Patterns & Gotchas

- **Decrypt Subscription Key node:** responseFormat MUST be `text` not `json`. PostgREST RPC returns the plaintext secret wrapped in quotes as a string, not a JSON object. Use `onError: continueErrorOutput` to route failures to "Mark Failed (No Key)" branch instead of stopping workflow.
- **Subscription key quote stripping:** After decrypt, the key comes back as `"cfcc...cf"` (literal quotes). Use `.replace(/^"|"$/g, '')` to strip them, NOT `JSON.parse()` which is fragile. Alternatives: regex capture `$json.data.match(/"([^"]+)"/)` or check if it's JSON before parsing.
- **Build Receipt XML with icls namespace:** AADE rejects XML unless classification elements (classificationType, classificationCategory, amount) are in the `icls:` namespace. Add `xmlns:icls="https://www.aade.gr/myDATA/incomeClassificaton/v1.0"` at root `<InvoicesDoc>` element, then prefix all classification child elements with `icls:`.
- **Submit to AADE endpoint selection:** Build an expression that checks `practitioners.mydata_environment` to swap endpoints: sandbox = `https://mydataapidev.aade.gr`, production = `https://mydatapi.aade.gr/myDATA/`. Use `$if()` for lazy evaluation to avoid executing unused branches.
- **AADE response envelope:** AADE wraps XML inside a .NET `<string>` element, not returned as raw XML. Response looks like `{string: "<?xml...?>"}`. Parse AADE Response node should NOT parse as XML; instead, return `$json.string` (the raw XML string inside). Let Extract Result regex out the fields directly instead of parsing the tree.
- **Extract Result from AADE XML:** Use regex to extract statusCode, invoiceMark, errors from the XML string. Regex patterns: statusCode: `/statusCode>([^<]+)<\/statusCode/`, invoiceMark: `/invoiceMark>([^<]+)<\/invoiceMark/`, error messages: `/message>([^<]+)<\/message/`. Use `$if()` for optional fields so missing fields don't error; fall back to null.
- **Log to Supabase with JSON.stringify:** When POSTing to sms_log or mydata_audit_log with complex fields, ensure all values are properly JSON-escaped. Use `JSON.stringify(value)` for string fields that might contain quotes or newlines, NOT manual `.replace(/\"/g, '\\\"')`. This guarantees valid JSON bodies.
- **Lazy evaluation in n8n:** Use `$if()` instead of ternary operator for expressions that reference optional/conditional nodes. Ternary may try to evaluate both branches even if one is skipped. Example: `$if($node['Extract Result'].isExecuted, $json.errorMessage, 'Unknown error')` only evaluates the second branch if Extract Result ran.
- **Error routing in n8n:** Use `onError: continueErrorOutput` on HTTP nodes that might fail. This passes the error as an output to subsequent IF nodes instead of stopping the workflow. Then wire IF branches to success/failure handlers. Do NOT use `neverError: true` (deprecated) or rely on global Error Trigger (n8n strips runData from error context).
- **Docker env var passthrough:** docker-compose.yml dashboard service must explicitly list env vars in the `environment:` section for them to reach the Next.js container. Simply setting them at the top-level `services:` scope is insufficient. Include: N8N_RECEIPT_WEBHOOK_URL, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SCRIBE_FORM_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET.
