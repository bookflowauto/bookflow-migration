# BookFlow Calendar Page — Implementation Spec

**Date:** 2026-05-20
**Status:** Ready to implement
**Purpose:** Instructions for another Claude chat to build the calendar page

---

## Context for the Other Claude

You're working on BookFlow, a Greek-language SaaS for private-practice psychologists. Stack: Next.js 14, Supabase, Tailwind CSS, shadcn/ui components. The app already has:

- ✅ Patient management
- ✅ Appointment data model (linked to Google Calendar)
- ✅ AI scribe for SOAP notes
- ✅ Intake forms (Fillout)
- ✅ Receipt issuance (myDATA)
- ⚠️ Currently: appointments are visible only on patient detail pages, NOT in a unified calendar view

**Your task:** Build a dedicated `/dashboard/calendar` page that gives practitioners a unified view of all their appointments across all patients.

---

## Research-Based Design Decisions

After analyzing the top therapy practice management calendars (SimplePractice, TherapyNotes, Jane App, TheraPlatform, Carepatron), here are the patterns that consistently work for therapists:

### What Therapists Need (Validated Patterns)

1. **Three view modes:** Day, Week, Month
   - **Week view = default** (most therapists work in weekly rhythms)
   - Day view for detailed single-day planning
   - Month view for overview/upcoming bookings

2. **Drag-and-drop rescheduling** (SimplePractice's killer feature)
   - Click-and-drag appointments to new times
   - Visual feedback during drag
   - Auto-confirmation modal before save

3. **Color-coded appointments** (TheraNest pattern)
   - Different colors for: confirmed, pending, completed, no-show, cancelled
   - Color also indicates: with patient name visible

4. **Quick-info popovers** (Jane App pattern)
   - Click on appointment → see all details without leaving calendar
   - Patient name, time, status, notes preview, action buttons

5. **Inline create appointment** (SimplePractice)
   - Click any empty time slot → create new appointment
   - No modal redirect to separate page
   - Quick form: patient, time, duration, notes

6. **Status indicators at-a-glance**
   - SMS reminder sent (✓ icon)
   - Intake completed (✓ icon)
   - SOAP note exists (✓ icon)
   - Receipt issued (✓ icon)

7. **Today indicator** (universal pattern)
   - "Today" button to jump to current day
   - Current time line in day/week view
   - Highlighted "today" cell in month view

8. **Navigation controls** (universal pattern)
   - Previous/Next arrows
   - Date picker for jumping to specific date
   - View toggle (Day/Week/Month)

---

## Reference Apps to Study

Tell the developer to **look at these for visual reference**:

### Primary Inspiration: **SimplePractice Calendar**
- URL: https://www.simplepractice.com (look for "Calendar" feature)
- What to copy:
  - Week view as default
  - Drag-and-drop interaction
  - Color-coded status
  - Side panel for appointment details (slide-out)
  - Quick action buttons (Edit, Cancel, Reschedule)

### Secondary Inspiration: **Jane App**
- URL: https://www.jane.app
- What to copy:
  - Modern, clean visual design
  - Multi-day vs. weekly views
  - Patient name prominently displayed in appointment cards
  - Color system: muted, professional (no clown colors)

### Tertiary Inspiration: **Google Calendar (familiar UX)**
- What to copy:
  - Time slot grid layout
  - Hover-to-create-appointment
  - Multi-day event spanning
  - Mini-calendar in sidebar (optional)

---

## Page Structure & Layout

### Top Navigation Bar (Sticky)

```
┌─────────────────────────────────────────────────────────────┐
│  [< Today >]  [Day | Week | Month]    [+ New Appointment]  │
│                                                             │
│  May 19 - May 25, 2026                                      │
└─────────────────────────────────────────────────────────────┘
```

**Components:**
- **Left side:** Previous/Today/Next navigation
- **Center:** View toggle (Day/Week/Month) — segmented control
- **Right side:** "+ New Appointment" button (primary action, teal/green)
- **Below:** Current date range display (centered, large font)

---

### Week View (Default)

Layout:
- **Vertical axis:** Time (8 AM - 9 PM by default, configurable)
- **Horizontal axis:** Days of week (Mon-Sun, configurable to show only working days)
- **Cells:** 30-minute slots (configurable to 15/30/60 min)
- **Appointments:** Rendered as colored blocks spanning their duration

```
        Mon    Tue    Wed    Thu    Fri    Sat    Sun
8:00   │
8:30   │
9:00   │  📅 Patient A
9:30   │  9:00-10:00
10:00  │
10:30  │
11:00  │
       │
       │
```

**Status colors (use Tailwind CSS):**
- 🟢 **Confirmed:** `bg-green-100 border-green-500` (default)
- 🟡 **Pending:** `bg-yellow-100 border-yellow-500`
- ✅ **Completed:** `bg-blue-100 border-blue-500`
- ❌ **Cancelled:** `bg-gray-200 border-gray-400` (strikethrough text)
- ⚠️ **No-show:** `bg-red-100 border-red-500`

**Appointment card content (in week view):**
```
┌─────────────────────────────┐
│ 09:00 - 10:00              │  ← Time
│ Δημήτρης Παπαδόπουλος       │  ← Patient name
│ ✓ SMS ✓ SOAP                │  ← Status icons (small)
└─────────────────────────────┘
```

---

### Day View

Single column view of the selected day:
- **More detail per appointment**
- **Vertical time slots:** 7 AM - 10 PM
- **Current time indicator:** Horizontal line showing current time
- **Appointment shows full details:** Patient name, notes preview, status, action buttons

```
8:00 ─────────────────────────────────────
       
9:00 ─┬─────────────────────────────────┐
      │ 09:00 - 10:00                   │
      │ Δημήτρης Παπαδόπουλος            │
      │ ✓ SMS sent ✓ SOAP exists         │
      │ Notes: "Continue CBT for anxiety" │
      │ [Edit] [Cancel] [Issue Receipt]  │
9:30 ─┘                                  
10:00 ─────────────────────────────────────
       
       ╶─── 10:30 (current time) ───╶
```

---

### Month View

Standard calendar grid:
- **5-6 weeks visible**
- **Each cell shows:** Date number + appointment count (e.g., "3 appointments")
- **Hover/click cell:** Switch to day view for that date
- **Color dots:** Indicate appointment statuses (green=confirmed, yellow=pending, etc.)

```
        Mon    Tue    Wed    Thu    Fri    Sat    Sun
        1      2      3      4      5      6      7
        ●●     ●      ●●●●            
        
        8      9      10     11     12     13     14
        ●●●    ●●●●●  ●●     ●              
        
        15     16     17     18     19 *   20     21
                                    ●●●●●          
```

---

## Side Panel (Appointment Detail)

**Behavior:** When user clicks an appointment, a slide-out panel appears on the right (300-400px wide).

**Content:**
```
┌──────────────────────────────────────┐
│ ✕                       Edit  Cancel │
│                                       │
│ 📅 Δημήτρης Παπαδόπουλος             │
│ Tuesday, May 21, 2026                │
│ 09:00 - 10:00 (60 minutes)           │
│ Status: ✓ Confirmed                  │
│                                       │
│ ─────────────────────────────────    │
│ Workflows                             │
│ ✓ SMS reminder sent (May 20, 21:00)  │
│ ✓ Intake form completed              │
│ ✓ SOAP note exists                   │
│ ⚠ Receipt not yet issued             │
│   [Issue Receipt to myDATA]          │
│                                       │
│ ─────────────────────────────────    │
│ Quick Notes                           │
│ "Follow-up on anxiety management.    │
│ Last session: positive progress."    │
│                                       │
│ ─────────────────────────────────    │
│ Actions                               │
│ [Edit Appointment]                    │
│ [Add SOAP Note]                       │
│ [Mark No-Show]                        │
│ [Cancel Appointment]                  │
│ [Open Patient Profile]                │
└──────────────────────────────────────┘
```

---

## New Appointment Modal

**Trigger:** Click "+ New Appointment" or click empty time slot

**Form fields:**
1. **Patient** (autocomplete dropdown from existing patients OR "Create new patient")
2. **Date** (date picker, defaults to selected date)
3. **Time** (time picker, defaults to selected slot)
4. **Duration** (15/30/45/60/90 min selector)
5. **Service type** (optional: dropdown of treatment types)
6. **Notes** (optional textarea)
7. **Send SMS reminder** (checkbox, default checked)
8. **Recurring** (optional: daily/weekly/biweekly/monthly)

**Buttons:**
- `[Cancel]` (gray)
- `[Save Appointment]` (teal/primary)

---

## Drag-and-Drop Behavior

**Implementation:**
- Use `react-beautiful-dnd` or `@dnd-kit/core` library
- User clicks and drags appointment to new time slot
- Visual feedback: appointment becomes semi-transparent, cursor changes
- **Drop validation:**
  - Check if new time conflicts with another appointment
  - If conflict: show warning ("This conflicts with another appointment, are you sure?")
  - If valid: show confirmation modal before save
- **Database update:**
  - Update appointment time
  - Re-trigger SMS reminder (if appointment is in future)
  - Update Google Calendar sync

---

## Quick Filters (Top of Calendar)

Above the calendar grid, add filter chips:
- `[All Appointments]` (default)
- `[Confirmed only]`
- `[Pending]`
- `[Today]`
- `[This Week]`
- `[Need Receipt]`
- `[Need SOAP Note]`

---

## Sidebar (Left Side - Optional)

```
┌────────────────────┐
│ Quick Stats         │
│                     │
│ Today: 5 sessions   │
│ This week: 23      │
│ This month: 87     │
│                     │
│ ──────────────     │
│ Mini Calendar      │
│ (small month view) │
│                     │
│ ──────────────     │
│ Upcoming           │
│ • Mon 9:00 Δ.Π.    │
│ • Mon 11:00 Κ.Μ.   │
│ • Tue 10:00 Λ.Σ.   │
└────────────────────┘
```

---

## Mobile Responsiveness

**Desktop (>1024px):** Full layout with sidebar
**Tablet (768-1024px):** Hide left sidebar, keep main calendar
**Mobile (<768px):** 
- Default to day view (week view too cramped)
- Hide top filter chips (move to dropdown)
- Stack navigation controls vertically
- Touch-friendly: larger tap targets (44px minimum)

---

## Technical Requirements

### Data Model (Supabase)

Use existing `appointments` table. Required fields:
```sql
- id (uuid)
- practitioner_id (uuid, FK)
- patient_id (uuid, FK)
- start_time (timestamp)
- end_time (timestamp)
- status (enum: confirmed | pending | completed | cancelled | no_show)
- google_event_id (string, nullable)
- sms_reminder_sent (boolean)
- intake_completed (boolean)
- soap_note_id (uuid, nullable)
- receipt_id (uuid, nullable)
- notes (text, nullable)
- recurring_group_id (uuid, nullable)
- created_at, updated_at
```

### Required Endpoints

- `GET /api/appointments?start=2026-05-19&end=2026-05-25` - Fetch appointments in date range
- `POST /api/appointments` - Create new appointment
- `PATCH /api/appointments/[id]` - Update (reschedule, change status, etc.)
- `DELETE /api/appointments/[id]` - Cancel appointment
- `POST /api/appointments/[id]/sms-reminder` - Trigger SMS reminder manually
- `POST /api/appointments/[id]/issue-receipt` - Trigger receipt issuance

### Recommended Libraries

- **Calendar UI:** Build custom using Tailwind CSS (don't use FullCalendar — overkill and clunky)
- **Drag-and-drop:** `@dnd-kit/core` (lightweight, modern)
- **Date handling:** `date-fns` (already in project)
- **Time pickers:** Native HTML5 `<input type="time">` or shadcn/ui Calendar component
- **Modals:** shadcn/ui Dialog
- **Side panel:** shadcn/ui Sheet
- **Tooltips:** shadcn/ui Tooltip

---

## Design Tokens (Use Project Standards)

### Colors (already in project)
```css
--primary: hsl(173 80% 40%);          /* Teal - main brand */
--primary-foreground: hsl(0 0% 100%); /* White on teal */
--accent: hsl(173 70% 50%);           /* Lighter teal */
--background: hsl(0 0% 100%);         /* White */
--foreground: hsl(173 20% 15%);       /* Dark gray-blue */
--muted: hsl(173 10% 95%);            /* Very light gray */
--muted-foreground: hsl(173 10% 50%); /* Medium gray */
--border: hsl(173 15% 90%);           /* Light border */
```

### Status Colors (NEW - add to design system)
```css
--status-confirmed: hsl(120 50% 50%);  /* Green */
--status-pending: hsl(45 90% 60%);     /* Yellow */
--status-completed: hsl(210 70% 55%);  /* Blue */
--status-cancelled: hsl(0 0% 50%);     /* Gray */
--status-no-show: hsl(0 60% 55%);      /* Red */
```

### Typography
- **Headings:** font-bold, text-foreground
- **Body:** text-sm, font-normal
- **Captions:** text-xs, text-muted-foreground

---

## Component Architecture

```
src/app/dashboard/calendar/
├── page.tsx                  # Main calendar page
├── components/
│   ├── CalendarHeader.tsx    # Top nav (Today, prev/next, view toggle)
│   ├── CalendarGrid.tsx      # Main grid view (day/week/month)
│   ├── AppointmentCard.tsx   # Individual appointment block
│   ├── AppointmentDetail.tsx # Side panel for details
│   ├── NewAppointmentModal.tsx # Create new appointment modal
│   ├── QuickFilters.tsx      # Filter chips at top
│   ├── Sidebar.tsx           # Left sidebar (stats, mini-cal, upcoming)
│   └── TimeIndicator.tsx     # "Current time" line for day/week view
├── hooks/
│   ├── useCalendar.ts        # Date navigation, view state
│   ├── useAppointments.ts    # Fetch & manage appointments
│   └── useDragDrop.ts        # Drag-and-drop logic
└── utils/
    ├── dateHelpers.ts        # Format dates, calculate ranges
    └── appointmentHelpers.ts # Status colors, time formatting
```

---

## Sample Code Patterns to Follow

### Calendar Grid Component (Pseudo-code)

```tsx
'use client'

import { useCalendar } from './hooks/useCalendar'
import { useAppointments } from './hooks/useAppointments'

export function CalendarGrid({ view }: { view: 'day' | 'week' | 'month' }) {
  const { currentDate, navigate } = useCalendar()
  const { appointments, isLoading } = useAppointments(currentDate, view)
  
  if (view === 'week') {
    return <WeekView appointments={appointments} currentDate={currentDate} />
  }
  if (view === 'day') {
    return <DayView appointments={appointments} currentDate={currentDate} />
  }
  return <MonthView appointments={appointments} currentDate={currentDate} />
}
```

### Status Color Logic

```tsx
function getStatusColor(status: AppointmentStatus): string {
  return {
    confirmed: 'bg-status-confirmed/20 border-status-confirmed text-status-confirmed-foreground',
    pending: 'bg-status-pending/20 border-status-pending text-status-pending-foreground',
    completed: 'bg-status-completed/20 border-status-completed text-status-completed-foreground',
    cancelled: 'bg-status-cancelled/20 border-status-cancelled line-through opacity-60',
    no_show: 'bg-status-no-show/20 border-status-no-show text-status-no-show-foreground',
  }[status]
}
```

---

## Greek Language Requirements

All UI text must be in Greek. Use these translations:

```typescript
const translations = {
  calendar: {
    today: 'Σήμερα',
    day: 'Ημέρα',
    week: 'Εβδομάδα',
    month: 'Μήνας',
    newAppointment: 'Νέο Ραντεβού',
    
    // Days of week
    monday: 'Δευτέρα',
    tuesday: 'Τρίτη',
    wednesday: 'Τετάρτη',
    thursday: 'Πέμπτη',
    friday: 'Παρασκευή',
    saturday: 'Σάββατο',
    sunday: 'Κυριακή',
    
    // Status
    confirmed: 'Επιβεβαιωμένο',
    pending: 'Σε αναμονή',
    completed: 'Ολοκληρωμένο',
    cancelled: 'Ακυρωμένο',
    noShow: 'Δεν εμφανίστηκε',
    
    // Actions
    edit: 'Επεξεργασία',
    cancel: 'Ακύρωση',
    save: 'Αποθήκευση',
    delete: 'Διαγραφή',
    reschedule: 'Αναπρογραμματισμός',
    issueReceipt: 'Έκδοση Απόδειξης',
    addSoapNote: 'Προσθήκη σημείωσης SOAP',
    markNoShow: 'Σημάνετε ως μη εμφάνιση',
    
    // Workflow status
    smsReminderSent: 'SMS υπενθύμιση στάλθηκε',
    intakeCompleted: 'Intake ολοκληρώθηκε',
    soapNoteExists: 'Σημείωση SOAP υπάρχει',
    receiptNotIssued: 'Απόδειξη δεν εκδόθηκε',
    receiptIssued: 'Απόδειξη εκδόθηκε',
    
    // Form labels
    patient: 'Ασθενής',
    date: 'Ημερομηνία',
    time: 'Ώρα',
    duration: 'Διάρκεια',
    serviceType: 'Τύπος υπηρεσίας',
    notes: 'Σημειώσεις',
    recurring: 'Επαναλαμβανόμενο',
    
    // Quick stats
    sessionsToday: 'Συνεδρίες σήμερα',
    sessionsThisWeek: 'Συνεδρίες αυτή την εβδομάδα',
    sessionsThisMonth: 'Συνεδρίες αυτό το μήνα',
  }
}
```

---

## Performance Requirements

- **Initial load:** < 1 second to render calendar with 50 appointments
- **View switching:** < 200ms transition between day/week/month
- **Drag-and-drop:** No lag, smooth 60fps animation
- **Real-time updates:** Listen to Supabase Realtime for new appointments

---

## Accessibility (a11y)

- All interactive elements: keyboard navigable
- ARIA labels on icons (e.g., `aria-label="SMS reminder sent"`)
- Color is NOT the only indicator (always have icons too)
- Focus states visible
- Screen reader friendly: appointment cards announce title + time + status
- Touch targets: min 44px on mobile

---

## Implementation Phases

**Phase 1 (MVP - 3-4 days):**
- Basic calendar layout (Week view default)
- Display existing appointments
- Click to view appointment details (side panel)
- Status colors

**Phase 2 (Core features - 3-4 days):**
- Day and Month views
- Create new appointment (modal)
- Edit appointment details
- Cancel appointment

**Phase 3 (Polish - 2-3 days):**
- Drag-and-drop rescheduling
- Quick filters
- Sidebar with stats
- Mobile responsiveness

**Phase 4 (Advanced - optional):**
- Recurring appointments
- Multi-day events
- Google Calendar 2-way sync improvements
- Export to ICS

---

## Testing Checklist

Before considering the calendar "done":

- [ ] Loads in under 1 second with 50+ appointments
- [ ] Drag-and-drop works smoothly on desktop and mobile
- [ ] All 3 views (day/week/month) work correctly
- [ ] Status colors are clear and accessible
- [ ] Side panel slides in smoothly
- [ ] New appointment modal validates form properly
- [ ] Cancel appointment shows confirmation dialog
- [ ] SMS reminders trigger on schedule
- [ ] Greek language displays correctly (no font issues)
- [ ] Mobile layout doesn't break
- [ ] Keyboard navigation works (tab through appointments)
- [ ] Screen reader announces appointment details correctly

---

## Final Notes for the Implementer

1. **Don't over-engineer.** Build the MVP first, then add features.
2. **Match SimplePractice's UX patterns** — they've spent years optimizing this for therapists.
3. **Use Tailwind + shadcn/ui** — don't pull in a heavy calendar library like FullCalendar.
4. **Mobile-first** — many therapists check their calendar on phones between sessions.
5. **Greek language is critical** — never default to English.
6. **Performance matters** — therapists open this page 20+ times per day.

---

**Hand this entire document to the other Claude. They have everything they need to build the calendar page.**
