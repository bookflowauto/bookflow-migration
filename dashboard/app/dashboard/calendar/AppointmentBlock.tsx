'use client'

import { useT } from '@/lib/i18n/client'
import {
  type Appointment,
  SESSION_MINUTES,
  formatTime,
  heightForDuration,
  statusStyle,
  topForTime,
} from './utils'

// A positioned appointment block for day/week timeline views.
export default function AppointmentBlock({
  appointment,
  onSelect,
  compact = false,
}: {
  appointment: Appointment
  onSelect: (a: Appointment) => void
  compact?: boolean // week view is narrower → less content
}) {
  const { t, bcp } = useT()
  const start = new Date(appointment.appointment_time)
  const top = topForTime(start)
  const height = heightForDuration(SESSION_MINUTES)
  const style = statusStyle(appointment.status)
  const isCancelled = appointment.status === 'cancelled'
  const name = appointment.patient_name ?? t('calendar.unknownPatient')

  return (
    <button
      type="button"
      onClick={() => onSelect(appointment)}
      className="absolute left-1 right-1 text-left rounded-md px-2 py-1.5 overflow-hidden transition-shadow hover:shadow-md focus:outline-none focus:ring-2"
      style={{
        top,
        height,
        background: style.bg,
        borderLeft: `3px solid ${style.border}`,
        color: style.text,
      }}
      title={`${formatTime(start, bcp)} · ${name}`}
    >
      <div className="text-[10px] font-medium opacity-80">{formatTime(start, bcp)}</div>
      <div
        className={`text-xs font-semibold leading-tight truncate ${isCancelled ? 'line-through opacity-60' : ''}`}
        style={{ color: 'var(--text)' }}
      >
        {name}
      </div>
      {!compact && (
        <div className="mt-0.5 flex gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          {appointment.raw_transcript && <span title={t('panel.soap.done')}>✓ SOAP</span>}
          {appointment.mydata_status === 'submitted' && <span title={t('panel.receipt.done')}>✓ €</span>}
        </div>
      )}
    </button>
  )
}
