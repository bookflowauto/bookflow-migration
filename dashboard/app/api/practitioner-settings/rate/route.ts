import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

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

  let payload: { rate_per_session_eur?: number }
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const rate = payload.rate_per_session_eur
  if (typeof rate !== 'number' || rate <= 0) {
    return NextResponse.json(
      { error: 'rate_per_session_eur must be a positive number' },
      { status: 400 },
    )
  }

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { error: updErr } = await admin
    .from('practitioners')
    .update({ rate_per_session_eur: rate })
    .eq('user_id', user.id)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to update rate' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
