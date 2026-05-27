import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe signature' }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    console.error('[Stripe Webhook] Signature verification failed:', error);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // In newer Stripe API versions, current_period_start/end live on the subscription item,
  // not the subscription itself. Fall back to the subscription-level fields for older payloads.
  function getPeriod(sub: Stripe.Subscription) {
    const item = sub.items?.data?.[0] as any;
    const start = item?.current_period_start ?? (sub as any).current_period_start;
    const end = item?.current_period_end ?? (sub as any).current_period_end;
    return {
      start: typeof start === 'number' ? new Date(start * 1000).toISOString() : null,
      end: typeof end === 'number' ? new Date(end * 1000).toISOString() : null,
    };
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        const practitionerId = subscription.metadata?.practitioner_id;
        const planTier = subscription.metadata?.plan_tier;

        if (!practitionerId || !planTier) {
          console.warn('[Stripe Webhook] Missing metadata in subscription');
          break;
        }

        const period = getPeriod(subscription);
        const { error: updateError } = await supabase
          .from('practitioners')
          .update({
            plan_tier: planTier,
            billing_status: 'active',
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            current_period_start: period.start,
            current_period_end: period.end,
          })
          .eq('id', practitionerId);

        if (updateError) {
          console.error('[Stripe Webhook] Failed to update practitioner:', updateError);
        } else {
          console.log(`[Stripe Webhook] Activated subscription for practitioner ${practitionerId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const practitionerId = subscription.metadata?.practitioner_id;

        if (!practitionerId) {
          console.warn('[Stripe Webhook] Missing practitioner_id in subscription');
          break;
        }

        const period = getPeriod(subscription);
        const updateData: any = {};
        if (period.start) updateData.current_period_start = period.start;
        if (period.end) updateData.current_period_end = period.end;

        if (subscription.status === 'active') {
          updateData.billing_status = 'active';
        } else if (subscription.status === 'past_due') {
          updateData.billing_status = 'past_due';
        } else if (subscription.status === 'canceled') {
          updateData.billing_status = 'cancelled';
        }

        const { error: updateError } = await supabase
          .from('practitioners')
          .update(updateData)
          .eq('id', practitionerId);

        if (updateError) {
          console.error('[Stripe Webhook] Failed to update subscription:', updateError);
        } else {
          console.log(`[Stripe Webhook] Updated subscription for practitioner ${practitionerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const practitionerId = subscription.metadata?.practitioner_id;

        if (!practitionerId) {
          console.warn('[Stripe Webhook] Missing practitioner_id in deleted subscription');
          break;
        }

        const { error: updateError } = await supabase
          .from('practitioners')
          .update({ billing_status: 'cancelled' })
          .eq('id', practitionerId);

        if (updateError) {
          console.error('[Stripe Webhook] Failed to cancel subscription:', updateError);
        } else {
          console.log(`[Stripe Webhook] Cancelled subscription for practitioner ${practitionerId}`);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (!customerId) {
          console.warn('[Stripe Webhook] Missing customer in failed invoice');
          break;
        }

        const { error: updateError } = await supabase
          .from('practitioners')
          .update({ billing_status: 'past_due' })
          .eq('stripe_customer_id', customerId);

        if (updateError) {
          console.error('[Stripe Webhook] Failed to update past_due status:', updateError);
        } else {
          console.log(`[Stripe Webhook] Marked customer ${customerId} as past_due`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
