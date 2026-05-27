// Calendar utilities — pure functions, no React.
// We avoid date-fns to keep the bundle lean; native Date is enough.

export const SESSION_MINUTES = 50 // clinical hour default; appointments table has no end_time
export const DAY_START_HOUR = 8 // first row on day/week grid
export const DAY_END_HOUR = 21 // last row (exclusive on the top edge of next hour)
export const SLOT_MINUTES = 30 // grid resolution
export const HOUR_HEIGHT_PX = 56 // visual height of one hour

export type CalendarView = 'day' | 'week' | 'month'

export type Appointment = {
  appointment_id: string
  appointment_time: string
  summary: string | null
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled'
  scribe_status: 'pending' | 'transcribing' | 'complete' | 'failed'
  raw_transcript: string | null
  mydata_status: string | null
  mydata_mark: string | null
  patient_id: string | null
  patient_ref: string | null
  patient_name: string | null
  patient_phone: string | null
  intake_status: 'pending' | 'completed' | null
}

// ────────────────────────────────────────────────────────────────────
// Date math (mutation-free)
// ────────────────────────────────────────────────────────────────────

export function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

// Monday as first day of week (European convention; matches Greek calendar).
export function startOfWeek(d: Date): Date {
  const x = startOfDay(d)
  const dow = x.getDay() // 0=Sun..6=Sat
  const diff = (dow + 6) % 7 // days back to Monday
  x.setDate(x.getDate() - diff)
  return x
}

export function endOfWeek(d: Date): Date {
  const s = startOfWeek(d)
  return endOfDay(addDays(s, 6))
}

export function startOfMonth(d: Date): Date {
  const x = new Date(d)
  x.setDate(1)
  x.setHours(0, 0, 0, 0)
  return x
}

export function endOfMonth(d: Date): Date {
  const x = startOfMonth(d)
  x.setMonth(x.getMonth() + 1)
  x.setMilliseconds(-1)
  return x
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}

export function addMonths(d: Date, n: number): Date {
  const x = new Date(d)
  x.setMonth(x.getMonth() + n)
  return x
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Visible range for a given view + anchor date.
export function rangeForView(view: CalendarView, anchor: Date): { start: Date; end: Date } {
  if (view === 'day') return { start: startOfDay(anchor), end: endOfDay(anchor) }
  if (view === 'week') return { start: startOfWeek(anchor), end: endOfWeek(anchor) }
  // Month view also pads to full weeks (6 rows of 7 days)
  const monthStart = startOfMonth(anchor)
  const monthEnd = endOfMonth(anchor)
  return { start: startOfWeek(monthStart), end: endOfWeek(monthEnd) }
}

// Navigate one step forward/back in the current view.
export function shift(view: CalendarView, anchor: Date, dir: -1 | 1): Date {
  if (view === 'day') return addDays(anchor, dir)
  if (view === 'week') return addDays(anchor, 7 * dir)
  return addMonths(anchor, dir)
}

// ────────────────────────────────────────────────────────────────────
// Formatters
// ────────────────────────────────────────────────────────────────────

export function formatRangeLabel(view: CalendarView, anchor: Date, bcp: string = 'en-GB'): string {
  if (view === 'day') {
    return anchor.toLocaleDateString(bcp, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }
  if (view === 'week') {
    const s = startOfWeek(anchor)
    const e = endOfWeek(anchor)
    const sameMonth = s.getMonth() === e.getMonth()
    const sameYear = s.getFullYear() === e.getFullYear()
    const sStr = s.toLocaleDateString(bcp, {
      day: 'numeric',
      month: sameMonth ? undefined : 'short',
      year: sameYear ? undefined : 'numeric',
    })
    const eStr = e.toLocaleDateString(bcp, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
    return `${sStr} – ${eStr}`
  }
  return anchor.toLocaleDateString(bcp, { month: 'long', year: 'numeric' })
}

export function formatTime(d: Date, bcp: string = 'en-GB'): string {
  return d.toLocaleTimeString(bcp, { hour: '2-digit', minute: '2-digit' })
}

export function isoDateOnly(d: Date): string {
  // YYYY-MM-DD in local time (not UTC, which is what URL state should reflect)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function parseISODateOnly(s: string | undefined | null): Date {
  if (!s) return new Date()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return new Date()
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function parseView(s: string | undefined | null): CalendarView {
  if (s === 'day' || s === 'month') return s
  return 'week'
}

// ────────────────────────────────────────────────────────────────────
// Layout helpers (positioning blocks on day/week grid)
// ────────────────────────────────────────────────────────────────────

// Top offset (px) for a given Date within the day grid.
export function topForTime(d: Date): number {
  const minutes = d.getHours() * 60 + d.getMinutes() - DAY_START_HOUR * 60
  return (minutes / 60) * HOUR_HEIGHT_PX
}

export function heightForDuration(minutes: number): number {
  return Math.max(20, (minutes / 60) * HOUR_HEIGHT_PX)
}

export const TOTAL_DAY_HEIGHT_PX = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_HEIGHT_PX

export function hourRows(): number[] {
  const out: number[] = []
  for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) out.push(h)
  return out
}

export function weekDays(anchor: Date): Date[] {
  const s = startOfWeek(anchor)
  return Array.from({ length: 7 }, (_, i) => addDays(s, i))
}

// All days shown in a month view (6 rows × 7 cols = 42 cells).
export function monthDays(anchor: Date): Date[] {
  const { start } = rangeForView('month', anchor)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

// ────────────────────────────────────────────────────────────────────
// Status helpers
// ────────────────────────────────────────────────────────────────────

export type StatusStyle = {
  // background tint and left-border accent for appointment blocks
  bg: string
  border: string
  text: string
  // small dot color for month view
  dot: string
}

export function statusStyle(status: Appointment['status']): StatusStyle {
  switch (status) {
    case 'confirmed':
      return {
        bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
        border: 'var(--accent)',
        text: 'var(--accent)',
        dot: 'var(--accent)',
      }
    case 'completed':
      return {
        bg: 'var(--surface-2)',
        border: 'var(--text-subtle)',
        text: 'var(--text-muted)',
        dot: 'var(--text-subtle)',
      }
    case 'cancelled':
      return {
        bg: 'var(--danger-bg)',
        border: 'var(--danger)',
        text: 'var(--danger)',
        dot: 'var(--danger)',
      }
    case 'scheduled':
    default:
      return {
        bg: 'var(--info-bg)',
        border: 'var(--info)',
        text: 'var(--info)',
        dot: 'var(--info)',
      }
  }
}
