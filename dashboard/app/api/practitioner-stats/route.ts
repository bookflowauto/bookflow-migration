import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  // Use anon key first to validate token
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  // Try to get current user with the token
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    console.error('Auth error:', authError);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Now use service role to fetch practitioner data
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: practitioner, error } = await supabaseAdmin
    .from('practitioners')
    .select('plan_tier, regenerate_soap_count, regenerate_soap_reset_date')
    .eq('user_id', user.id)
    .single();

  if (error || !practitioner) {
    console.error('Practitioner fetch error:', error);
    return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
  }

  return NextResponse.json({
    plan_tier: practitioner.plan_tier,
    regenerate_soap_count: practitioner.regenerate_soap_count,
    regenerate_soap_reset_date: practitioner.regenerate_soap_reset_date,
  });
}
