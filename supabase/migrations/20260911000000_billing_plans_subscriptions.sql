-- Subscription billing: 3 seat-based plans (Starter/Growth/Business), each
-- monthly or annual, via Stripe Checkout + webhook. Plans differ only in
-- how many team members (profiles) a company may have — every feature is
-- available on every plan, matching the product's existing "one system"
-- positioning rather than gating capability behind price.

create table plans (
  id text primary key,
  name text not null,
  seat_limit int, -- null = unlimited seats
  price_monthly_cents int not null,
  price_annual_cents int not null,
  -- Populated once the Stripe Products/Prices exist (see
  -- scripts/stripe-setup.mjs) — checkout can't run for a plan until its
  -- price ids are set.
  stripe_price_id_monthly text,
  stripe_price_id_annual text,
  sort_order int not null
);

alter table plans enable row level security;
create policy "plans readable by anyone" on plans for select using (true);

insert into plans (id, name, seat_limit, price_monthly_cents, price_annual_cents, stripe_price_id_monthly, stripe_price_id_annual, sort_order) values
  ('starter', 'Starter', 3, 4900, 49000, 'price_1UEQe9LnI3Cm0PrRTQH6vblX', 'price_1UEQe9LnI3Cm0PrRg0RXp9cc', 1),
  ('growth', 'Growth', 10, 9900, 99000, 'price_1UEQeBLnI3Cm0PrRMsmC6aS8', 'price_1UEQeBLnI3Cm0PrRLUiv95xk', 2),
  ('business', 'Business', null, 19900, 199000, 'price_1UEQeDLnI3Cm0PrRQp81rxW6', 'price_1UEQeDLnI3Cm0PrRwZjrdSBp', 3);

create table company_subscriptions (
  company_id uuid primary key references companies (id) on delete cascade,
  plan_id text references plans (id),
  billing_cycle text check (billing_cycle in ('monthly', 'annual')),
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text not null default 'incomplete'
    check (status in ('incomplete', 'active', 'past_due', 'canceled')),
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table company_subscriptions enable row level security;

-- Read-only for regular users: only the service-role key (used by the
-- Stripe webhook and checkout/portal-session Edge Functions) ever writes
-- this table, so there is no insert/update/delete policy here at all.
create policy "own company subscription" on company_subscriptions for select
  using (company_id = auth_company_id());

create or replace function public.touch_company_subscription_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger company_subscriptions_touch_updated_at
  before update on company_subscriptions
  for each row
  execute function public.touch_company_subscription_updated_at();

-- Grandfather every company that already exists as of this migration onto
-- an active, unlimited-seat plan — this product had public self-serve
-- signup running before billing existed, so a hard paywall must not lock
-- an already-running workspace out of its own data. New companies created
-- after this migration get no row here and are gated into plan selection
-- by the app (see App.jsx / ChoosePlanPage) until they subscribe.
insert into company_subscriptions (company_id, plan_id, billing_cycle, status)
select id, 'business', 'monthly', 'active' from companies
on conflict (company_id) do nothing;
