-- Surface rebate and production figures on the public proposal page, so a
-- customer sees price after STC/battery rebates rather than just the raw
-- system price.
drop function if exists public.get_quote_by_token(uuid);

create function public.get_quote_by_token(p_token uuid)
returns table (
  id uuid, first_name text, last_name text, address_line text, suburb text, state text,
  postcode text, system_size_kw numeric, panel_count int, price numeric, notes text,
  status quote_status, accepted_at timestamptz, company_name text,
  estimated_annual_kwh numeric, stc_count int, stc_amount numeric,
  battery_capacity_kwh numeric, bstc_amount numeric
)
language sql
security definer
set search_path = public
as $$
  select q.id, q.first_name, q.last_name, q.address_line, q.suburb, q.state, q.postcode,
         q.system_size_kw, q.panel_count, q.price, q.notes, q.status, q.accepted_at,
         c.company_name, q.estimated_annual_kwh, q.stc_count, q.stc_amount,
         q.battery_capacity_kwh, q.bstc_amount
  from quotes q
  join companies c on c.id = q.company_id
  where q.accept_token = p_token;
$$;

revoke all on function public.get_quote_by_token(uuid) from public;
grant execute on function public.get_quote_by_token(uuid) to anon, authenticated;
