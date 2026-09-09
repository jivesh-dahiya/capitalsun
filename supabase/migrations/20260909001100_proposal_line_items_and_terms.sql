-- Public read of a quote's line items by token (same security model as
-- get_quote_by_token: unguessable token, security definer, no direct table
-- grant to anon).
create function public.get_quote_line_items_by_token(p_token uuid)
returns table (
  id uuid, description text, quantity numeric, unit_price numeric,
  included boolean, sort_order int
)
language sql
security definer
set search_path = public
as $$
  select li.id, li.description, li.quantity, li.unit_price, li.included, li.sort_order
  from quote_line_items li
  join quotes q on q.id = li.quote_id
  where q.accept_token = p_token
  order by li.sort_order, li.created_at;
$$;

revoke all on function public.get_quote_line_items_by_token(uuid) from public;
grant execute on function public.get_quote_line_items_by_token(uuid) to anon, authenticated;

-- Also expose deposit_percent through the main proposal lookup.
drop function if exists public.get_quote_by_token(uuid);

create function public.get_quote_by_token(p_token uuid)
returns table (
  id uuid, first_name text, last_name text, email text, mobile text,
  address_line text, suburb text, state text, postcode text,
  system_size_kw numeric, panel_count int, price numeric, notes text,
  status quote_status, accepted_at timestamptz, created_at timestamptz,
  updated_at timestamptz, valid_until date, deposit_percent numeric,
  terms_accepted boolean,
  estimated_annual_kwh numeric, stc_count int, stc_amount numeric,
  battery_capacity_kwh numeric, bstc_amount numeric,
  company_name text, company_legal_entity_name text, company_abn text,
  company_logo_url text, company_email text, company_mobile text,
  company_website text, company_address_line text, company_suburb text,
  company_state text, company_postcode text,
  prepared_by_name text, prepared_by_mobile text,
  panel_manufacturer text, panel_model text, panel_watt numeric,
  inverter_manufacturer text, inverter_model text, inverter_kw numeric, inverter_quantity int,
  battery_manufacturer text, battery_model text, battery_kwh numeric, battery_quantity int,
  warranty_years int
)
language sql
security definer
set search_path = public
as $$
  select q.id, q.first_name, q.last_name, q.email, q.mobile,
         q.address_line, q.suburb, q.state, q.postcode,
         q.system_size_kw, q.panel_count, q.price, q.notes, q.status, q.accepted_at,
         q.created_at, q.updated_at, q.valid_until, q.deposit_percent, q.terms_accepted,
         q.estimated_annual_kwh, q.stc_count, q.stc_amount,
         q.battery_capacity_kwh, q.bstc_amount,
         c.company_name, c.legal_entity_name, c.abn,
         c.logo_url, c.email, c.mobile,
         c.website, c.address_line, c.suburb, c.state, c.postcode,
         trim(concat(p.first_name, ' ', p.last_name)), p.mobile,
         pm.name, pmo.name, pmo.power_kw,
         im.name, imo.name, imo.power_kw, q.inverter_quantity,
         bm.name, bmo.name, bmo.capacity_kwh, q.battery_quantity,
         null::int
  from quotes q
  join companies c on c.id = q.company_id
  left join profiles p on p.id = q.created_by
  left join equipment_models pmo on pmo.id = q.panel_model_id
  left join manufacturers pm on pm.id = pmo.manufacturer_id
  left join equipment_models imo on imo.id = q.inverter_model_id
  left join manufacturers im on im.id = imo.manufacturer_id
  left join equipment_models bmo on bmo.id = q.battery_model_id
  left join manufacturers bm on bm.id = bmo.manufacturer_id
  where q.accept_token = p_token;
$$;

revoke all on function public.get_quote_by_token(uuid) from public;
grant execute on function public.get_quote_by_token(uuid) to anon, authenticated;

-- Accepting a proposal now also records terms acceptance.
create or replace function public.accept_quote(p_token uuid, p_accepted_by_name text)
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

  update quotes set status = 'accepted', accepted_at = now(), accepted_by_name = p_accepted_by_name,
    created_job_id = new_job_id, terms_accepted = true, terms_accepted_at = now()
  where id = q.id;

  if q.lead_id is not null then
    update leads set stage = 'won', converted_job_id = new_job_id where id = q.lead_id;
  end if;

  return new_job_id;
end;
$$;
