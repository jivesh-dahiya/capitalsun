#!/usr/bin/env node
// One-time setup: creates the 3 Capitalsun Products in Stripe, each with a
// monthly and an annual Price, matching supabase/migrations/
// 20260911000000_billing_plans_subscriptions.sql. Run this once per Stripe
// account (test mode first, then again in live mode when ready to launch).
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... node scripts/stripe-setup.mjs
//
// It prints a SQL UPDATE statement for each plan — run that against the
// Supabase project (SQL editor or `supabase db execute`) to wire the real
// Stripe price ids into the `plans` table so checkout can find them.

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error('Set STRIPE_SECRET_KEY first, e.g.:\n  STRIPE_SECRET_KEY=sk_test_xxx node scripts/stripe-setup.mjs');
  process.exit(1);
}

const PLANS = [
  { id: 'starter', name: 'Capitalsun Starter', priceMonthly: 4900, priceAnnual: 49000 },
  { id: 'growth', name: 'Capitalsun Growth', priceMonthly: 9900, priceAnnual: 99000 },
  { id: 'business', name: 'Capitalsun Business', priceMonthly: 19900, priceAnnual: 199000 },
];

async function stripeRequest(path, body) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || `Stripe request failed: ${path}`);
  return data;
}

async function main() {
  console.log(`Using ${secretKey.startsWith('sk_live') ? 'LIVE' : 'TEST'} mode key.\n`);
  const sqlLines = [];

  for (const plan of PLANS) {
    const product = await stripeRequest('products', {
      name: plan.name,
      'metadata[plan_id]': plan.id,
    });
    console.log(`Created product ${plan.name} (${product.id})`);

    const monthlyPrice = await stripeRequest('prices', {
      product: product.id,
      currency: 'aud',
      unit_amount: String(plan.priceMonthly),
      'recurring[interval]': 'month',
    });
    const annualPrice = await stripeRequest('prices', {
      product: product.id,
      currency: 'aud',
      unit_amount: String(plan.priceAnnual),
      'recurring[interval]': 'year',
    });
    console.log(`  monthly price: ${monthlyPrice.id} ($${plan.priceMonthly / 100} AUD/mo)`);
    console.log(`  annual price:  ${annualPrice.id} ($${plan.priceAnnual / 100} AUD/yr)\n`);

    sqlLines.push(
      `update plans set stripe_price_id_monthly = '${monthlyPrice.id}', stripe_price_id_annual = '${annualPrice.id}' where id = '${plan.id}';`
    );
  }

  console.log('--- Run this against your Supabase database (SQL editor is easiest) ---\n');
  console.log(sqlLines.join('\n'));
  console.log('\n--- Then set these as Supabase Edge Function secrets ---');
  console.log('supabase secrets set STRIPE_SECRET_KEY=' + secretKey);
  console.log('supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... (from the Stripe webhook endpoint you create)');
  console.log('supabase secrets set SITE_URL=https://capitalsun.vercel.app');
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
