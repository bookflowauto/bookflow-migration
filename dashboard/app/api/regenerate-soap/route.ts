import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const REGENERATE_LIMITS: Record<string, number> = {
  essentials: 25,
  professional: 60,
  premium: Infinity,
};

function getFirstOfCurrentMonth(): string {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split('T')[0];
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  // Validate token first
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser(token);
  if (authError || !user) {
    console.error('Auth error in regenerate-soap:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Use service role for data mutations
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.json();
  const { appointment_id } = body;

  if (!appointment_id) {
    return NextResponse.json(
      { error: 'Missing appointment_id' },
      { status: 400 }
    );
  }

  // Fetch practitioner
  const { data: practitioner, error: practitionerError } = await supabase
    .from('practitioners')
    .select('id, plan_tier, regenerate_soap_count, regenerate_soap_reset_date')
    .eq('user_id', user.id)
    .single();

  if (practitionerError || !practitioner) {
    return NextResponse.json(
      { error: 'Practitioner not found' },
      { status: 404 }
    );
  }

  // Check if reset date is past (lazy reset)
  const resetDate = new Date(practitioner.regenerate_soap_reset_date);
  const firstOfMonth = new Date(getFirstOfCurrentMonth());
  let currentCount = practitioner.regenerate_soap_count;

  if (resetDate < firstOfMonth) {
    currentCount = 0;
    await supabase
      .from('practitioners')
      .update({
        regenerate_soap_count: 0,
        regenerate_soap_reset_date: getFirstOfCurrentMonth(),
      })
      .eq('id', practitioner.id);
  }

  // Check quota
  const planTier = practitioner.plan_tier || 'essentials';
  const limit = REGENERATE_LIMITS[planTier] || 25;

  if (currentCount >= limit) {
    return NextResponse.json(
      {
        error: `You've used all regenerations this month. Upgrade to Professional for more.`,
      },
      { status: 429 }
    );
  }

  // Increment count atomically
  const { error: updateError } = await supabase
    .from('practitioners')
    .update({ regenerate_soap_count: currentCount + 1 })
    .eq('id', practitioner.id);

  if (updateError) {
    return NextResponse.json(
      { error: 'Failed to update quota' },
      { status: 500 }
    );
  }

  // Call n8n webhook
  try {
    const webhookUrl = 'https://n8n.bookflow.uk/webhook/regenerate-soap';
    const webhookRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appointment_id }),
    });

    if (!webhookRes.ok) {
      return NextResponse.json(
        { error: 'Failed to regenerate SOAP. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, remaining: limit - (currentCount + 1) },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to regenerate SOAP. Please try again.' },
      { status: 500 }
    );
  }
}
