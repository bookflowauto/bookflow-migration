import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const token = authHeader.replace(/^Bearer\s+/i, '')
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
  if (authError || !user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: { currentPassword?: string; newPassword?: string }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { currentPassword, newPassword } = payload
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both currentPassword and newPassword required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 })
  }

  // Re-authenticate by signing in with the current password on a fresh client.
  // Using a separate client avoids mutating the caller's session token.
  const reauthClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { error: signInErr } = await reauthClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInErr) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
  const { error: updErr } = await admin.auth.admin.updateUserById(user.id, {
    password: newPassword,
  })
  if (updErr) {
    return NextResponse.json({ error: updErr.message || 'Failed to update password' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
