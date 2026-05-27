import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// myDATA endpoints. Sandbox is used during onboarding for safety.
const MYDATA_BASE = {
  sandbox: 'https://mydataapidev.aade.gr',
  production: 'https://mydatapi.aade.gr/myDATA',
} as const

type Environment = keyof typeof MYDATA_BASE

interface SavePayload {
  mydata_username: string
  mydata_subscription_key: string
  mydata_environment: Environment
  vat_number: string
  kad_code: string
  business_address: string
  vat_regime: 'exempt' | 'standard' | 'mixed'
  has_taxable_secondary_activity: boolean
}

function bad(field: string) {
  return NextResponse.json({ error: `Missing or invalid field: ${field}` }, { status: 400 })
}

async function verifyCredentials(
  env: Environment,
  username: string,
  subscriptionKey: string,
): Promise<{ ok: true } | { ok: false; status: number; body: string }> {
  // RequestDocs with mark=0 returns recent inbound docs — a read-only call
  // suitable for confirming credentials work without submitting anything.
  const url = `${MYDATA_BASE[env]}/RequestDocs?mark=0`
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'aade-user-id': username,
      'Ocp-Apim-Subscription-Key': subscriptionKey,
    },
    // AADE can be slow; abort after 15s rather than hanging the request.
    signal: AbortSignal.timeout(15_000),
  })
  if (res.ok) return { ok: true }
  // Read body for the audit log, but truncate — AADE errors can be verbose.
  const text = (await res.text().catch(() => '')).slice(0, 2_000)
  return { ok: false, status: res.status, body: text }
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const token = authHeader.replace(/^Bearer\s+/i, '')

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: SavePayload
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validation — fail loud, never partially save.
  if (!payload.mydata_username?.trim()) return bad('mydata_username')
  if (!payload.mydata_subscription_key?.trim()) return bad('mydata_subscription_key')
  if (payload.mydata_environment !== 'sandbox' && payload.mydata_environment !== 'production') {
    return bad('mydata_environment')
  }
  if (!/^\d{9}$/.test(payload.vat_number ?? '')) return bad('vat_number')
  if (!/^\d{6,8}$/.test(payload.kad_code ?? '')) return bad('kad_code')
  if (!payload.business_address?.trim()) return bad('business_address')
  if (!['exempt', 'standard', 'mixed'].includes(payload.vat_regime)) return bad('vat_regime')

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: practitioner, error: pErr } = await admin
    .from('practitioners')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (pErr || !practitioner) {
    return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 })
  }

  // Verify credentials against AADE before persisting anything.
  const verify = await verifyCredentials(
    payload.mydata_environment,
    payload.mydata_username.trim(),
    payload.mydata_subscription_key.trim(),
  )

  // Audit-log the attempt either way. NEVER log the subscription key.
  await admin.from('mydata_audit_log').insert({
    practitioner_id: practitioner.id,
    action: 'verify_credentials',
    environment: payload.mydata_environment,
    request_summary: { username: payload.mydata_username.trim() },
    response_status: verify.ok ? 200 : verify.status,
    response_body: verify.ok ? null : { body: verify.body },
    error_message: verify.ok ? null : `AADE returned ${verify.status}`,
  })

  if (!verify.ok) {
    const message = verify.status === 401 || verify.status === 403
      ? 'AADE rejected the credentials. Check the username and subscription key.'
      : `AADE returned ${verify.status}. Try again or contact support.`
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Store subscription key in Vault via the SECURITY DEFINER wrapper.
  const { error: secretErr } = await admin.rpc('set_mydata_subscription_key', {
    p_practitioner_id: practitioner.id,
    p_subscription_key: payload.mydata_subscription_key.trim(),
  })
  if (secretErr) {
    return NextResponse.json({ error: 'Failed to store credentials' }, { status: 500 })
  }

  const { error: updErr } = await admin
    .from('practitioners')
    .update({
      mydata_username: payload.mydata_username.trim(),
      mydata_environment: payload.mydata_environment,
      mydata_credentials_verified: true,
      mydata_credentials_verified_at: new Date().toISOString(),
      vat_number: payload.vat_number,
      kad_code: payload.kad_code,
      business_address: payload.business_address.trim(),
      vat_regime: payload.vat_regime,
      has_taxable_secondary_activity: !!payload.has_taxable_secondary_activity,
    })
    .eq('id', practitioner.id)

  if (updErr) {
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, verified_at: new Date().toISOString() })
}
