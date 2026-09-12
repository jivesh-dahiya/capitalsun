// Receives Stripe's subscription lifecycle events and keeps
// company_subscriptions in sync. This is the only place subscription
// status ever changes after checkout — the frontend never writes it
// directly, so a lapsed card or a cancellation is reflected here even if
// the user never opens the app again to trigger it.
//
// No Supabase auth header exists on these requests (Stripe calls this
// directly, server to server), so this function is registered with
// verify_jwt = false in config.toml and authenticates the request itself
// via Stripe's own signature header instead.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  if (!stripeSecretKey || !webhookSecret) {
    return json({ error: 'Stripe is not configured' }, 500);
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  const signature = req.headers.get('Stripe-Signature');
  if (!signature) return json({ error: 'Missing Stripe-Signature header' }, 400);

  const rawBody = await req.text();
  let event: Stripe.Event;
  try {
    // constructEventAsync (not the sync constructEvent) because Deno's
    // SubtleCrypto-backed implementation only exposes the async form.
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, webhookSecret);
  } catch (err) {
    return json({ error: `Invalid signature: ${(err as Error).message}` }, 400);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  async function upsertFromSubscription(sub: Stripe.Subscription, companyIdHint?: string) {
    const companyId = companyIdHint || (sub.metadata?.company_id as string | undefined);
    if (!companyId) return; // nothing we can key this to

    const priceId = sub.items.data[0]?.price?.id;
    let planId: string | null = null;
    let billingCycle: 'monthly' | 'annual' | null = null;
    if (priceId) {
      const { data: plan } = await admin
        .from('plans')
        .select('id, stripe_price_id_monthly, stripe_price_id_annual')
        .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_annual.eq.${priceId}`)
        .maybeSingle();
      if (plan) {
        planId = plan.id;
        billingCycle = plan.stripe_price_id_monthly === priceId ? 'monthly' : 'annual';
      }
    }

    const status = sub.status === 'active' ? 'active'
      : sub.status === 'trialing' ? 'trialing'
      : sub.status === 'past_due' || sub.status === 'unpaid' ? 'past_due'
      : sub.status === 'canceled' || sub.status === 'incomplete_expired' ? 'canceled'
      : 'incomplete';

    const periodEndSeconds = sub.items.data[0]?.current_period_end;

    await admin.from('company_subscriptions').upsert(
      {
        company_id: companyId,
        ...(planId ? { plan_id: planId } : {}),
        ...(billingCycle ? { billing_cycle: billingCycle } : {}),
        stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
        stripe_subscription_id: sub.id,
        status,
        current_period_end: periodEndSeconds ? new Date(periodEndSeconds * 1000).toISOString() : null,
        trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      },
      { onConflict: 'company_id' }
    );
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === 'subscription' && session.subscription) {
        const subId = typeof session.subscription === 'string' ? session.subscription : session.subscription.id;
        const sub = await stripe.subscriptions.retrieve(subId);
        await upsertFromSubscription(sub, session.client_reference_id || (session.metadata?.company_id as string | undefined));
      }
      break;
    }
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription;
      await upsertFromSubscription(sub);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const companyId = sub.metadata?.company_id as string | undefined;
      if (companyId) {
        await admin.from('company_subscriptions')
          .update({ status: 'canceled' })
          .eq('company_id', companyId);
      }
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (subId) {
        await admin.from('company_subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_subscription_id', subId);
      }
      break;
    }
    default:
      break; // ignore everything else
  }

  return json({ received: true });
});
