import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface NotificationsPayload {
  sms_reminder_enabled?: boolean
  reminder_offset_hours?: number
  email_digest_enabled?: boolean
}

export async function PATCH(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: NotificationsPayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, boolean | number> = {}

  if (payload.sms_reminder_enabled !== undefined) {
    if (typeof payload.sms_reminder_enabled !== 'boolean') {
      return NextResponse.json({ error: 'sms_reminder_enabled must be boolean' }, { status: 400 })
    }
    updates.sms_reminder_enabled = payload.sms_reminder_enabled
  }

  if (payload.email_digest_enabled !== undefined) {
    if (typeof payload.email_digest_enabled !== 'boolean') {
      return NextResponse.json({ error: 'email_digest_enabled must be boolean' }, { status: 400 })
    }
    updates.email_digest_enabled = payload.email_digest_enabled
  }

  if (payload.reminder_offset_hours !== undefined) {
    const n = payload.reminder_offset_hours
    if (typeof n !== 'number' || !Number.isInteger(n) || n < 1 || n > 168) {
      return NextResponse.json(
        { error: 'reminder_offset_hours must be an integer between 1 and 168' },
        { status: 400 },
      )
    }
    updates.reminder_offset_hours = n
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: updErr } = await admin
    .from('practitioners')
    .update(updates)
    .eq('user_id', user.id)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
