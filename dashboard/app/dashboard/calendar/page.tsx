import { createClient } from '@/lib/supabase/server'
import Calendar from './Calendar'
import {
  type Appointment,
  parseISODateOnly,
  parseView,
  rangeForView,
} from './utils'

type SearchParams = Promise<{ view?: string; date?: string }>

export default async function CalendarPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams
  const view = parseView(sp.view)
  const anchor = parseISODateOnly(sp.date)
  const { start, end } = rangeForView(view, anchor)

  const supabase = await createClient()

  // RLS scopes to current practitioner via v_appointment_full → appointments policy.
  const { data: appointments } = await supabase
    .from('v_appointment_full')
    .select(
      'appointment_id, appointment_time, summary, status, scribe_status, raw_transcript, mydata_status, mydata_mark, patient_id, patient_ref, patient_name, patient_phone, intake_status',
    )
    .gte('appointment_time', start.toISOString())
    .lte('appointment_time', end.toISOString())
    .order('appointment_time', { ascending: true })

  return (
    <Calendar
      view={view}
      anchorISO={anchor.toISOString()}
      appointments={((appointments ?? []) as unknown) as Appointment[]}
    />
  )
}
