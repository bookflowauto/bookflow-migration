import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ALLOWED_NEW: ReadonlySet<string> = new Set(['completed', 'cancelled'])
const ALLOWED_FROM: ReadonlySet<string> = new Set(['scheduled', 'confirmed'])

export async function PATCH(
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

  let payload: { status?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const newStatus = payload.status
  if (!newStatus || !ALLOWED_NEW.has(newStatus)) {
    return NextResponse.json(
      { error: `status must be one of: ${[...ALLOWED_NEW].join(', ')}` },
      { status: 400 },
    )
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: apt, error: aptErr } = await admin
    .from('appointments')
    .select('id, practitioner_id, status')
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

  if (!ALLOWED_FROM.has(apt.status)) {
    return NextResponse.json(
      { error: `Cannot change status from '${apt.status}'` },
      { status: 400 },
    )
  }

  const { error: updErr } = await admin
    .from('appointments')
    .update({ status: newStatus })
    .eq('id', appointmentId)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, status: newStatus })
}
