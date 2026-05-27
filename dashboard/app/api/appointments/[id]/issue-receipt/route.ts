import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  let payload: { amount?: number }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const amount = payload.amount
  if (typeof amount !== 'number' || amount <= 0) {
    return NextResponse.json(
      { error: 'amount must be a positive number' },
      { status: 400 },
    )
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Verify practitioner owns this appointment
  const { data: apt, error: aptErr } = await admin
    .from('appointments')
    .select('id, practitioner_id, appointment_time, patient_id, status, mydata_status, mydata_pending_at')
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

  // Check appointment is in a billable state. Confirmed = patient clicked SMS;
  // completed = practitioner manually marked it attended.
  if (apt.status !== 'confirmed' && apt.status !== 'completed') {
    return NextResponse.json(
      { error: 'Appointment must be confirmed or marked attended before issuing receipt' },
      { status: 400 },
    )
  }

  // A receipt is re-issuable if it failed OR if it's been stuck in 'pending' for > 5 min
  // (Workflow #5 likely crashed or n8n is down — treat as failed).
  const STALE_PENDING_MS = 90 * 1000
  const isStalePending =
    apt.mydata_status === 'pending' &&
    apt.mydata_pending_at &&
    Date.now() - new Date(apt.mydata_pending_at as string).getTime() > STALE_PENDING_MS

  if (apt.mydata_status && apt.mydata_status !== 'failed' && !isStalePending) {
    return NextResponse.json(
      { error: 'Receipt has already been issued or is pending' },
      { status: 400 },
    )
  }

  // Mark as pending and trigger n8n Workflow #5
  const { error: updErr } = await admin
    .from('appointments')
    .update({
      mydata_status: 'pending',
      mydata_pending_at: new Date().toISOString(),
    })
    .eq('id', appointmentId)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 })
  }

  // Call n8n Workflow #5 webhook
  // IMPORTANT: n8n webhook URL must be configured in env var
  const webhookUrl = process.env.N8N_RECEIPT_WEBHOOK_URL
  if (!webhookUrl) {
    return NextResponse.json(
      { error: 'Receipt workflow not configured' },
      { status: 500 },
    )
  }

  try {
    const wfRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appointmentId,
        practitionerId: practitioner.id,
        patientId: apt.patient_id,
        appointmentTime: apt.appointment_time,
        amount,
      }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!wfRes.ok) {
      const body = await wfRes.text().catch(() => '')
      console.error('Workflow webhook failed:', wfRes.status, body)
      // Roll back to 'failed' so the user can retry instead of being stuck on pending
      await admin
        .from('appointments')
        .update({ mydata_status: 'failed' })
        .eq('id', appointmentId)
      return NextResponse.json(
        { error: `Workflow webhook returned ${wfRes.status}: ${body.slice(0, 200) || 'no body'}` },
        { status: 502 },
      )
    }
  } catch (err: any) {
    console.error('Workflow webhook error:', err)
    await admin
      .from('appointments')
      .update({ mydata_status: 'failed' })
      .eq('id', appointmentId)
    return NextResponse.json(
      { error: `Could not reach receipt workflow: ${err?.message ?? 'unknown error'}` },
      { status: 502 },
    )
  }

  return NextResponse.json({ ok: true })
}
