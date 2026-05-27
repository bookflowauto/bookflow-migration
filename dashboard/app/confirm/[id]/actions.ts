'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function confirmAppointment(appointmentId: string) {
  const supabase = createAdminClient()

  const { data: apt, error } = await supabase
    .from('appointments')
    .update({ status: 'confirmed' })
    .eq('id', appointmentId)
    .select('id, patient_id, patients(intake_status, intake_form_link)')
    .single()

  if (error || !apt) {
    throw new Error('Could not confirm appointment')
  }

  const patient = Array.isArray(apt.patients) ? apt.patients[0] : apt.patients

  if (patient?.intake_status === 'pending') {
    const intakeUrl = patient.intake_form_link
      || process.env.NEXT_PUBLIC_INTAKE_FORM_URL
      || `/confirm/${appointmentId}/done`
    redirect(intakeUrl)
  }

  redirect(`/confirm/${appointmentId}/done`)
}
