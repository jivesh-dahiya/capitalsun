// Starts a Stripe Checkout session for the caller's company to subscribe
// (or switch) to a plan. Only an owner/admin may manage billing, same
// restriction as invite-teammate. Runs as an Edge Function because it needs
// the Stripe secret key, which must never reach the browser.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import Stripe from 'npm:stripe@17';
import { corsHeaders } from '../_shared/cors.ts';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!stripeSecretKey) {
    return json({ error: "Billing isn't set up yet — STRIPE_SECRET_KEY is not configured." }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const siteUrl = Deno.env.get('SITE_URL') || 'https://capitalsun.vercel.app';

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser();
  if (userError || !userData?.user) return json({ error: 'Not signed in' }, 401);

  const { data: callerProfile, error: profileLookupError } = await callerClient
    .from('profiles')
    .select('company_id, role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileLookupError || !callerProfile?.company_id) {
    return json({ error: "Couldn't find a company for your account" }, 400);
  }
  if (!['owner', 'admin'].includes(callerProfile.role)) {
    return json({ error: 'Only an owner or admin can manage billing' }, 403);
  }

  let body: { planId?: string; billingCycle?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Invalid request body' }, 400);
  }
  const planId = body.planId;
  const billingCycle = body.billingCycle === 'annual' ? 'annual' : 'monthly';
  if (!planId) return json({ error: 'planId is required' }, 400);

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: plan, error: planError } = await adminClient
    .from('plans')
    .select('*')
    .eq('id', planId)
    .maybeSingle();
  if (planError || !plan) return json({ error: 'Unknown plan' }, 400);

  const priceId = billingCycle === 'annual' ? plan.stripe_price_id_annual : plan.stripe_price_id_monthly;
  if (!priceId) {
    return json({ error: `Billing isn't set up yet — no Stripe price configured for ${plan.name} (${billingCycle}).` }, 500);
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });

  const { data: existingSub } = await adminClient
    .from('company_subscriptions')
    .select('stripe_customer_id')
    .eq('company_id', callerProfile.company_id)
    .maybeSingle();

  let customerId = existingSub?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userData.user.email,
      metadata: { company_id: callerProfile.company_id },
    });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/billing/choose-plan`,
    client_reference_id: callerProfile.company_id,
    subscription_data: { metadata: { company_id: callerProfile.company_id } },
    metadata: { company_id: callerProfile.company_id },
  });

  await adminClient.from('company_subscriptions').upsert(
    {
      company_id: callerProfile.company_id,
      plan_id: planId,
      billing_cycle: billingCycle,
      stripe_customer_id: customerId,
    },
    { onConflict: 'company_id' }
  );

  return json({ url: session.url });
});
