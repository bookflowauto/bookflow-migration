'use client'

import { useT } from '@/lib/i18n/client'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import {
  type Appointment,
  formatTime,
  isSameDay,
  monthDays,
  statusStyle,
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

export default function MonthView({
  anchor,
  appointments,
  onSelect,
  onJumpToDay,
}: {
  anchor: Date
  appointments: Appointment[]
  onSelect: (a: Appointment) => void
  onJumpToDay: (date: Date) => void
}) {
  const { t, bcp } = useT()
  const days = monthDays(anchor)
  const today = new Date()
  const currentMonth = anchor.getMonth()

  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
        {DAY_LABEL_KEYS.map(k => (
          <div
            key={k}
            className="py-2 text-center text-[10px] uppercase tracking-wider"
            style={{ color: 'var(--text-subtle)' }}
          >
            {t(k)}
          </div>
        ))}
      </div>

      {/* 6 × 7 cell grid */}
      <div className="grid grid-cols-7" style={{ gridAutoRows: 'minmax(96px, auto)' }}>
        {days.map((day, i) => {
          const inMonth = day.getMonth() === currentMonth
          const isToday = isSameDay(day, today)
          const dayApts = appointments.filter(a => isSameDay(new Date(a.appointment_time), day))

          return (
            <div
              key={i}
              className="border-r border-b p-1.5 relative flex flex-col gap-1 cursor-pointer transition-colors hover:bg-[var(--surface-2)]"
              style={{
                borderColor: 'var(--border)',
                background: inMonth ? 'transparent' : 'var(--surface-2)',
                opacity: inMonth ? 1 : 0.55,
              }}
              onDoubleClick={() => onJumpToDay(day)}
            >
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-semibold inline-flex items-center justify-center"
                  style={{
                    color: isToday ? 'var(--accent-fg)' : 'var(--text)',
                    background: isToday ? 'var(--accent)' : 'transparent',
                    width: isToday ? 22 : 'auto',
                    height: isToday ? 22 : 'auto',
                    borderRadius: 9999,
                  }}
                >
                  {day.getDate()}
                </span>
                {dayApts.length > 3 && (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      onJumpToDay(day)
                    }}
                    className="text-[10px] font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {t('calendar.moreCount', { n: dayApts.length - 3 })}
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-0.5 overflow-hidden">
                {dayApts.slice(0, 3).map(a => {
                  const s = statusStyle(a.status)
                  const time = formatTime(new Date(a.appointment_time), bcp)
                  return (
                    <button
                      key={a.appointment_id}
                      type="button"
                      onClick={e => {
                        e.stopPropagation()
                        onSelect(a)
                      }}
                      className="text-[10px] text-left rounded px-1 py-0.5 truncate flex items-center gap-1"
                      style={{ background: s.bg, color: 'var(--text)' }}
                    >
                      <span
                        className="w-1 h-1 rounded-full shrink-0"
                        style={{ background: s.dot }}
                      />
                      <span className="font-medium">{time}</span>
                      <span
                        className={`truncate ${a.status === 'cancelled' ? 'line-through opacity-60' : ''}`}
                      >
                        {a.patient_name ?? t('calendar.unknown')}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
