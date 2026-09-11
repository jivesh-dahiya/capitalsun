// Opens Stripe's hosted Billing Portal for the caller's company, so they
// can update their card, switch plans, view invoices, or cancel without
// any of that UI needing to be built here. Owner/admin only, same
// restriction as create-checkout-session.
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

  const { data: callerProfile } = await callerClient
    .from('profiles')
    .select('company_id, role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (!callerProfile?.company_id) return json({ error: "Couldn't find a company for your account" }, 400);
  if (!['owner', 'admin'].includes(callerProfile.role)) {
    return json({ error: 'Only an owner or admin can manage billing' }, 403);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: sub } = await adminClient
    .from('company_subscriptions')
    .select('stripe_customer_id')
    .eq('company_id', callerProfile.company_id)
    .maybeSingle();
  if (!sub?.stripe_customer_id) return json({ error: 'No billing account found yet' }, 400);

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' });
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${siteUrl}/profile`,
  });

  return json({ url: portalSession.url });
});
