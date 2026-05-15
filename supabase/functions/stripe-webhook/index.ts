// ============================================================
//  GTC ACADEMY — Edge Function: stripe-webhook
//  Handles all Stripe subscription lifecycle events
// ============================================================
import { serve }        from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Stripe           from 'https://esm.sh/stripe@14.21.0?target=deno';

const stripe    = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20', httpClient: Stripe.createFetchHttpClient() });
const supabase  = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const endSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'stripe-signature, content-type' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const sig  = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, endSecret);
  } catch (err: any) {
    console.error('Webhook signature failed:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }

  console.log('Stripe event:', event.type);

  try {
    switch (event.type) {

      // ── SUBSCRIPTION CREATED / UPDATED ──────────────────────────────────
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        const userId   = customer.metadata?.supabase_uid;
        if (!userId) { console.error('No supabase_uid in customer metadata'); break; }

        const priceId  = sub.items.data[0]?.price?.id ?? '';
        const monthlyId = Deno.env.get('STRIPE_MONTHLY_PRICE_ID');
        const annualId  = Deno.env.get('STRIPE_ANNUAL_PRICE_ID');
        const plan = priceId === annualId ? 'premium_annual' : 'premium_monthly';

        await supabase.from('subscriptions').upsert({
          user_id:              userId,
          plan,
          stripe_customer_id:   sub.customer as string,
          stripe_sub_id:        sub.id,
          status:               sub.status,
          trial_ends_at:        sub.trial_end   ? new Date(sub.trial_end   * 1000).toISOString() : null,
          current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
          current_period_end:   sub.current_period_end   ? new Date(sub.current_period_end   * 1000).toISOString() : null,
          cancel_at_period_end: sub.cancel_at_period_end,
          updated_at:           new Date().toISOString(),
        }, { onConflict: 'user_id' });

        // Send welcome notification if newly subscribed
        if (event.type === 'customer.subscription.created') {
          await supabase.from('notifications').insert({
            user_id: userId,
            type:    'marketing',
            title:   '💎 Welcome to Premium!',
            body:    'You now have access to all courses, templates, and unlimited AI chat.',
            deep_link: 'gtcacademy://premium-welcome',
          });
        }
        break;
      }

      // ── SUBSCRIPTION CANCELED ────────────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub      = event.data.object as Stripe.Subscription;
        const customer = await stripe.customers.retrieve(sub.customer as string) as Stripe.Customer;
        const userId   = customer.metadata?.supabase_uid;
        if (!userId) break;

        await supabase.from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('user_id', userId);

        // Profile plan synced automatically via DB trigger
        await supabase.from('notifications').insert({
          user_id: userId,
          type:    'system',
          title:   'Subscription Ended',
          body:    'Your Premium plan has ended. Upgrade anytime to regain access.',
          deep_link: 'gtcacademy://premium',
        });
        break;
      }

      // ── PAYMENT SUCCEEDED ─────────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice  = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        const userId   = customer.metadata?.supabase_uid;
        if (!userId) break;

        // Update subscription to active if it was past_due
        await supabase.from('subscriptions')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', invoice.customer as string);
        break;
      }

      // ── PAYMENT FAILED ────────────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice  = event.data.object as Stripe.Invoice;
        const customer = await stripe.customers.retrieve(invoice.customer as string) as Stripe.Customer;
        const userId   = customer.metadata?.supabase_uid;
        if (!userId) break;

        await supabase.from('subscriptions')
          .update({ status: 'past_due', updated_at: new Date().toISOString() })
          .eq('stripe_customer_id', invoice.customer as string);

        await supabase.from('notifications').insert({
          user_id: userId,
          type:    'system',
          title:   '⚠️ Payment Failed',
          body:    'We could not process your payment. Please update your payment method.',
          deep_link: 'gtcacademy://billing',
        });
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
