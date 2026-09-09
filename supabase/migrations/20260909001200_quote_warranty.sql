alter table quotes add column warranty_years int;

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
         q.warranty_years
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
