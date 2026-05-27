'use client'

import { useEffect, useState } from 'react'
import { useT } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import AppointmentBlock from './AppointmentBlock'
import {
  type Appointment,
  DAY_START_HOUR,
  HOUR_HEIGHT_PX,
  TOTAL_DAY_HEIGHT_PX,
  hourRows,
  isSameDay,
  topForTime,
  weekDays,
} from './utils'

const DAY_LABEL_KEYS: TranslationKey[] = [
  'calendar.day.mon',
  'calendar.day.tue',
  'calendar.day.wed',
  'calendar.day.thu',
  'calendar.day.fri',
  'calendar.day.sat',
  'calendar.day.sun',
]

export default function WeekView({
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
  const days = weekDays(anchor)
  const hours = hourRows()

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: 720 }}>
        {/* Day header row */}
        <div className="grid border-b" style={{ gridTemplateColumns: '64px repeat(7, 1fr)', borderColor: 'var(--border)' }}>
          <div />
          {days.map((d, i) => {
            const isToday = isSameDay(d, now)
            return (
              <div
                key={i}
                className="text-center py-2"
                style={{
                  borderLeft: '1px solid var(--border)',
                  background: isToday ? 'var(--accent-soft)' : 'transparent',
                }}
              >
                <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-subtle)' }}>
                  {t(DAY_LABEL_KEYS[i])}
                </div>
                <div
                  className="text-sm font-semibold mt-0.5"
                  style={{ color: isToday ? 'var(--accent)' : 'var(--text)' }}
                >
                  {d.getDate()}
                </div>
              </div>
            )
          })}
        </div>

        {/* Grid */}
        <div className="grid relative" style={{ gridTemplateColumns: '64px repeat(7, 1fr)', height: TOTAL_DAY_HEIGHT_PX }}>
          {/* Hour gutter */}
          <div className="relative">
            {hours.map((h, i) => (
              <div
                key={h}
                className="text-[10px] text-right pr-2 -translate-y-2"
                style={{ position: 'absolute', top: i * HOUR_HEIGHT_PX, right: 0, color: 'var(--text-subtle)' }}
              >
                {String(h).padStart(2, '0')}:00
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day, i) => {
            const dayApts = appointments.filter(a => isSameDay(new Date(a.appointment_time), day))
            const isToday = isSameDay(day, now)
            return (
              <div
                key={i}
                className="relative"
                style={{ borderLeft: '1px solid var(--border)' }}
              >
                {/* Hour grid lines */}
                {hours.map((h, hi) => (
                  <div
                    key={h}
                    className="absolute left-0 right-0"
                    style={{
                      top: hi * HOUR_HEIGHT_PX,
                      height: HOUR_HEIGHT_PX,
                      borderTop: hi === 0 ? 'none' : '1px solid var(--border)',
                    }}
                  />
                ))}

                {/* Today's now line */}
                {isToday && now.getHours() >= DAY_START_HOUR && now.getHours() < DAY_START_HOUR + hours.length && (
                  <div
                    className="absolute left-0 right-0 pointer-events-none z-10 flex items-center"
                    style={{ top: topForTime(now) }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full -ml-0.5" style={{ background: 'var(--accent)' }} />
                    <span className="flex-1 h-px" style={{ background: 'var(--accent)' }} />
                  </div>
                )}

                {dayApts.map(a => (
                  <AppointmentBlock
                    key={a.appointment_id}
                    appointment={a}
                    onSelect={onSelect}
                    compact
                  />
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function useNowTick(): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(id)
  }, [])
  return now
}
