import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Plan pricing (in EUR cents)
const PLANS = {
  essentials: { monthly: 5900, annual: 58800 }, // €59/mo or €49/mo annual
  professional: { monthly: 11900, annual: 118800 }, // €119/mo or €99/mo annual
  premium: { monthly: 22900, annual: 229200 }, // €229/mo or €191/mo annual
};

export async function POST(req: NextRequest) {
  try {
    // Get the user from the request (Supabase auth)
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the practitioner
    const { data: practitioner, error: practError } = await supabase
      .from('practitioners')
      .select('id, email')
      .eq('user_id', user.id)
      .single();

    if (practError || !practitioner) {
      return NextResponse.json({ error: 'Practitioner not found' }, { status: 404 });
    }

    // Parse request body
    const { plan_tier, billing_period } = await req.json();
    if (!plan_tier || !billing_period) {
      return NextResponse.json({ error: 'Missing plan_tier or billing_period' }, { status: 400 });
    }

    if (!PLANS[plan_tier as keyof typeof PLANS] || !['monthly', 'annual'].includes(billing_period)) {
      return NextResponse.json({ error: 'Invalid plan or billing period' }, { status: 400 });
    }

    const amount = PLANS[plan_tier as keyof typeof PLANS][billing_period as 'monthly' | 'annual'];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: practitioner.email,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `BookFlow ${plan_tier.charAt(0).toUpperCase() + plan_tier.slice(1)} Plan`,
              description: `${billing_period === 'annual' ? 'Annual' : 'Monthly'} subscription`,
            },
            unit_amount: amount,
            recurring: {
              interval: billing_period === 'annual' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: {
        metadata: {
          practitioner_id: practitioner.id,
          plan_tier,
          billing_period,
        },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bookflow.uk'}/dashboard/billing?checkout=success&plan=${plan_tier}&period=${billing_period}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.bookflow.uk'}/dashboard/billing?checkout=cancelled`,
      metadata: {
        practitioner_id: practitioner.id,
        plan_tier,
        billing_period,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('[Stripe Checkout]', error);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
