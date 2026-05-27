import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

interface ProfilePayload {
  name?: string
  email?: string
  phone?: string | null
  calendar_id?: string
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

  let payload: ProfilePayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const updates: Record<string, string | null> = {}

  if (payload.name !== undefined) {
    const name = payload.name.trim()
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    updates.name = name
  }

  if (payload.phone !== undefined) {
    const phone = payload.phone === null ? null : payload.phone.toString().trim()
    updates.phone = phone || null
  }

  if (payload.calendar_id !== undefined) {
    const calendarId = payload.calendar_id.trim()
    if (!calendarId) return NextResponse.json({ error: 'Calendar ID cannot be empty' }, { status: 400 })
    updates.calendar_id = calendarId
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Email change goes through Supabase Auth (triggers verification flow).
  // We mirror the new email to practitioners.email only after auth update succeeds.
  let emailChangePending = false
  if (payload.email !== undefined) {
    const email = payload.email.trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'Email cannot be empty' }, { status: 400 })
    if (email !== (user.email ?? '').toLowerCase()) {
      const { error: emailErr } = await admin.auth.admin.updateUserById(user.id, { email })
      if (emailErr) {
        return NextResponse.json({ error: emailErr.message || 'Failed to update email' }, { status: 400 })
      }
      updates.email = email
      emailChangePending = true
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ ok: true, emailChangePending: false })
  }

  const { error: updErr } = await admin
    .from('practitioners')
    .update(updates)
    .eq('user_id', user.id)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, emailChangePending })
}
