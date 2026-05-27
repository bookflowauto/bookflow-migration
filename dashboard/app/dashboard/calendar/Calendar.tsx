'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import AppointmentPanel from './AppointmentPanel'
import CalendarHeader from './CalendarHeader'
import DayView from './DayView'
import MonthView from './MonthView'
import WeekView from './WeekView'
import {
  type Appointment,
  type CalendarView,
  isoDateOnly,
  shift,
} from './utils'

type Props = {
  view: CalendarView
  anchorISO: string
  appointments: Appointment[]
}

export default function Calendar({ view, anchorISO, appointments }: Props) {
  const router = useRouter()
  const anchor = useMemo(() => new Date(anchorISO), [anchorISO])
  const [selected, setSelected] = useState<Appointment | null>(null)

  const navigate = useCallback(
    (next: { view?: CalendarView; date?: Date }) => {
      const v = next.view ?? view
      const d = next.date ?? anchor
      const url = `/dashboard/calendar?view=${v}&date=${isoDateOnly(d)}`
      router.push(url)
    },
    [router, view, anchor],
  )

  return (
    <>
      <CalendarHeader
        view={view}
        anchor={anchor}
        onPrev={() => navigate({ date: shift(view, anchor, -1) })}
        onNext={() => navigate({ date: shift(view, anchor, 1) })}
        onToday={() => navigate({ date: new Date() })}
        onViewChange={v => navigate({ view: v })}
      />

      <div className="bf-card overflow-hidden">
        {view === 'day' && (
          <DayView anchor={anchor} appointments={appointments} onSelect={setSelected} />
        )}
        {view === 'week' && (
          <WeekView anchor={anchor} appointments={appointments} onSelect={setSelected} />
        )}
        {view === 'month' && (
          <MonthView
            anchor={anchor}
            appointments={appointments}
            onSelect={setSelected}
            onJumpToDay={date => navigate({ view: 'day', date })}
          />
        )}
      </div>

      <AppointmentPanel
        appointment={selected}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
