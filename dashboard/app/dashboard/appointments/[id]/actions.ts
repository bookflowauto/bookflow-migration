'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function updateTranscript(appointmentId: string, transcript: string) {
  const supabase = createAdminClient()
  await supabase
    .from('appointments')
    .update({ raw_transcript: transcript })
    .eq('id', appointmentId)
  revalidatePath(`/dashboard/appointments/${appointmentId}`)
}
