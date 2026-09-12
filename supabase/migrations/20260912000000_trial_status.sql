-- 3-day free trial support: Stripe's own "trialing" subscription status is
-- tracked as its own value rather than folded into "active", so the UI can
-- honestly show "on trial, X days left" instead of a plain checkmark for a
-- card that hasn't been charged yet.
alter table company_subscriptions drop constraint company_subscriptions_status_check;
alter table company_subscriptions add constraint company_subscriptions_status_check
  check (status in ('incomplete', 'trialing', 'active', 'past_due', 'canceled'));

alter table company_subscriptions add column trial_end timestamptz;
