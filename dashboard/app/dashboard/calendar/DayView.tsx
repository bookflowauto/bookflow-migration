'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n/client'
import AppointmentBlock from './AppointmentBlock'
import {
  type Appointment,
  DAY_START_HOUR,
  HOUR_HEIGHT_PX,
  TOTAL_DAY_HEIGHT_PX,
  hourRows,
  isSameDay,
  topForTime,
} from './utils'

export default function DayView({
  anchor,
  appointments,
  onSelect,
}: {
  anchor: Date
  appointments: Appointment[]
  onSelect: (a: Appointment) => void
}) {
  const { t } = useT()
  const now = useNowTick()
  const today = isSameDay(anchor, now)
  const hours = hourRows()

  const todays = appointments.filter(a => isSameDay(new Date(a.appointment_time), anchor))

  return (
    <div className="flex" style={{ height: TOTAL_DAY_HEIGHT_PX + 32 }}>
      {/* Hour gutter */}
      <div className="w-16 shrink-0 pt-4 border-r" style={{ borderColor: 'var(--border)' }}>
        {hours.map(h => (
          <div
            key={h}
            className="text-[10px] text-right pr-2 -translate-y-2"
            style={{ height: HOUR_HEIGHT_PX, color: 'var(--text-subtle)' }}
          >
            {String(h).padStart(2, '0')}:00
          </div>
        ))}
      </div>

      {/* Timeline column */}
      <div className="relative flex-1 pt-4">
        {/* Hour grid lines */}
        {hours.map((h, i) => (
          <div
            key={h}
            className="absolute left-0 right-0"
            style={{
              top: i * HOUR_HEIGHT_PX,
              height: HOUR_HEIGHT_PX,
              borderTop: i === 0 ? 'none' : '1px solid var(--border)',
            }}
          />
        ))}

        {/* Current time line */}
        {today && (
          <CurrentTimeLine now={now} />
        )}

        {/* Appointments */}
        {todays.map(a => (
          <AppointmentBlock key={a.appointment_id} appointment={a} onSelect={onSelect} />
        ))}

        {todays.length === 0 && (
          <div
            className="absolute inset-0 flex items-center justify-center text-sm"
            style={{ color: 'var(--text-muted)' }}
          >
            {t('calendar.empty')}
          </div>
        )}
      </div>
    </div>
  )
}

function CurrentTimeLine({ now }: { now: Date }) {
  const h = now.getHours()
  if (h < DAY_START_HOUR || h >= DAY_START_HOUR + hourRows().length) return null
  const top = topForTime(now)
  return (
    <div
      className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
      style={{ top }}
    >
      <span
        className="w-2 h-2 rounded-full -ml-1"
        style={{ background: 'var(--accent)' }}
      />
      <span className="flex-1 h-px" style={{ background: 'var(--accent)' }} />
    </div>
  )
}

// Re-render every minute so the now-line walks down the grid.
function useNowTick(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}
