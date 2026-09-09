-- Itemized quote line items (description/qty/price), replacing the single
-- flat price with a real breakdown, matching how the actual proposal
-- document (and a real invoice) needs to itemize what's included.
create table quote_line_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  quote_id uuid not null references quotes (id) on delete cascade,
  description text not null,
  quantity numeric(10,2),
  unit_price numeric(10,2),
  included boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table quote_line_items enable row level security;

create policy "company quote line items" on quote_line_items for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

-- Deposit percentage for the payment-milestone split shown on the proposal
-- (defaults to 10%, matching common solar retail practice, editable per quote).
alter table quotes add column deposit_percent numeric(5,2) not null default 10;
alter table quotes add column terms_accepted boolean not null default false;
alter table quotes add column terms_accepted_at timestamptz;
