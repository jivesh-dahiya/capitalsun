-- Phase 2: Leads/Sales pipeline, Quotes with public digital acceptance,
-- Payment milestones, and Service/O&M tickets.

create type lead_stage as enum ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost');
create type quote_status as enum ('draft', 'sent', 'accepted', 'rejected');
create type ticket_severity as enum ('low', 'normal', 'high', 'critical');
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');

create table leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  mobile text,
  address_line text,
  suburb text,
  state text,
  postcode text,
  source text,
  stage lead_stage not null default 'new',
  estimated_value numeric(10,2),
  notes text,
  converted_job_id uuid,
  created_at timestamptz not null default now()
);

alter table jobs add column lead_id uuid references leads (id) on delete set null;
alter table jobs add column quote_id uuid;
alter table leads add constraint leads_converted_job_id_fkey foreign key (converted_job_id) references jobs (id) on delete set null;

create table quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  lead_id uuid references leads (id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text,
  mobile text,
  address_line text,
  suburb text,
  state text,
  postcode text,
  system_size_kw numeric(6,3),
  panel_count int,
  price numeric(10,2) not null default 0,
  notes text,
  status quote_status not null default 'draft',
  accept_token uuid not null default gen_random_uuid(),
  accepted_by_name text,
  accepted_at timestamptz,
  created_job_id uuid references jobs (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table jobs add constraint jobs_quote_id_fkey foreign key (quote_id) references quotes (id) on delete set null;

create table payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  milestone_label text not null,
  amount numeric(10,2) not null default 0,
  due_date date,
  paid boolean not null default false,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create table service_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  job_id uuid references jobs (id) on delete set null,
  first_name text not null,
  last_name text not null,
  mobile text,
  email text,
  category text not null default 'Other',
  severity ticket_severity not null default 'normal',
  status ticket_status not null default 'open',
  description text,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table leads enable row level security;
alter table quotes enable row level security;
alter table payments enable row level security;
alter table service_tickets enable row level security;

create policy "company leads" on leads for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

create policy "company quotes" on quotes for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

create policy "company payments" on payments for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

create policy "company service tickets" on service_tickets for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

-- Public digital-acceptance surface: customers have no login, so access to a single
-- quote is brokered entirely through these two definer functions keyed by the
-- unguessable accept_token, never through a direct table grant to anon.

create function public.get_quote_by_token(p_token uuid)
returns table (
  id uuid, first_name text, last_name text, address_line text, suburb text, state text,
  postcode text, system_size_kw numeric, panel_count int, price numeric, notes text,
  status quote_status, accepted_at timestamptz, company_name text
)
language sql
security definer
set search_path = public
as $$
  select q.id, q.first_name, q.last_name, q.address_line, q.suburb, q.state, q.postcode,
         q.system_size_kw, q.panel_count, q.price, q.notes, q.status, q.accepted_at,
         c.company_name
  from quotes q
  join companies c on c.id = q.company_id
  where q.accept_token = p_token;
$$;

create function public.accept_quote(p_token uuid, p_accepted_by_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  q quotes;
  new_job_id uuid;
begin
  select * into q from quotes where accept_token = p_token and status = 'sent';
  if not found then
    raise exception 'Quote not found or already actioned.';
  end if;

  insert into jobs (
    company_id, quote_id, lead_id, first_name, last_name, email, mobile,
    address_line, suburb, state, postcode, system_size_kw, job_type, job_status
  ) values (
    q.company_id, q.id, q.lead_id, q.first_name, q.last_name, q.email, q.mobile,
    q.address_line, q.suburb, q.state, q.postcode, q.system_size_kw, 'solar_pv_battery', 'new'
  ) returning id into new_job_id;

  update quotes set status = 'accepted', accepted_at = now(), accepted_by_name = p_accepted_by_name, created_job_id = new_job_id
  where id = q.id;

  if q.lead_id is not null then
    update leads set stage = 'won', converted_job_id = new_job_id where id = q.lead_id;
  end if;

  return new_job_id;
end;
$$;

revoke all on function public.get_quote_by_token(uuid) from public;
revoke all on function public.accept_quote(uuid, text) from public;
grant execute on function public.get_quote_by_token(uuid) to anon, authenticated;
grant execute on function public.accept_quote(uuid, text) to anon, authenticated;
