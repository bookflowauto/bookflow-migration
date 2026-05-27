import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Clears mydata_status back to NULL so the practitioner can re-issue.
// Used as the manual escape hatch when Workflow #5 crashes mid-execution
// and the dashboard is stuck on 'Submitting to AADE…'.
//
// Only allowed when status is 'pending' or 'failed' — never on a submitted
// receipt (those have a real AADE MARK and must be cancelled via AADE, not reset here).

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const appointmentId = (await params).id

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: apt, error: aptErr } = await admin
    .from('appointments')
    .select('id, practitioner_id, mydata_status')
    .eq('id', appointmentId)
    .single()

  if (aptErr || !apt) {
    return NextResponse.json({ error: 'Appointment not found' }, { status: 404 })
  }

  const { data: practitioner, error: pErr } = await admin
    .from('practitioners')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (pErr || !practitioner || apt.practitioner_id !== practitioner.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (apt.mydata_status !== 'pending' && apt.mydata_status !== 'failed') {
    return NextResponse.json(
      { error: `Cannot reset receipt in status '${apt.mydata_status}'` },
      { status: 400 },
    )
  }

  const { error: updErr } = await admin
    .from('appointments')
    .update({ mydata_status: null, mydata_pending_at: null })
    .eq('id', appointmentId)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to reset status' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
