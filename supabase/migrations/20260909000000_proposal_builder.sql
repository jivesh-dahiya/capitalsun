-- Real proposal document support: company branding (logo, website), who
-- prepared a quote and when it was last touched, and an offer expiry date —
-- everything the public proposal page needs to render a genuine branded
-- document rather than a bare pricing card.
alter table companies add column website text;

alter table quotes add column created_by uuid references profiles (id) on delete set null;
alter table quotes add column valid_until date;
alter table quotes add column updated_at timestamptz not null default now();

create or replace function public.touch_quote_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger quotes_touch_updated_at
  before update on quotes
  for each row
  execute function public.touch_quote_updated_at();

-- Public company logo storage — logos are shown on the public, unauthenticated
-- proposal page, so the bucket is public; write access stays scoped to the
-- uploading company via the path prefix, same pattern as job-documents.
insert into storage.buckets (id, name, public)
values ('company-logos', 'company-logos', true)
on conflict (id) do nothing;

create policy "upload own company logo" on storage.objects for insert
  with check (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth_company_id()::text);

create policy "update own company logo" on storage.objects for update
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth_company_id()::text);

create policy "delete own company logo" on storage.objects for delete
  using (bucket_id = 'company-logos' and (storage.foldername(name))[1] = auth_company_id()::text);

-- Richer public proposal data: company branding/contact, who prepared it,
-- and the customer's own contact details for the "addressed to" block.
drop function if exists public.get_quote_by_token(uuid);

create function public.get_quote_by_token(p_token uuid)
returns table (
  id uuid, first_name text, last_name text, email text, mobile text,
  address_line text, suburb text, state text, postcode text,
  system_size_kw numeric, panel_count int, price numeric, notes text,
  status quote_status, accepted_at timestamptz, created_at timestamptz,
  updated_at timestamptz, valid_until date,
  estimated_annual_kwh numeric, stc_count int, stc_amount numeric,
  battery_capacity_kwh numeric, bstc_amount numeric,
  company_name text, company_legal_entity_name text, company_abn text,
  company_logo_url text, company_email text, company_mobile text,
  company_website text, company_address_line text, company_suburb text,
  company_state text, company_postcode text,
  prepared_by_name text, prepared_by_mobile text
)
language sql
security definer
set search_path = public
as $$
  select q.id, q.first_name, q.last_name, q.email, q.mobile,
         q.address_line, q.suburb, q.state, q.postcode,
         q.system_size_kw, q.panel_count, q.price, q.notes, q.status, q.accepted_at,
         q.created_at, q.updated_at, q.valid_until,
         q.estimated_annual_kwh, q.stc_count, q.stc_amount,
         q.battery_capacity_kwh, q.bstc_amount,
         c.company_name, c.legal_entity_name, c.abn,
         c.logo_url, c.email, c.mobile,
         c.website, c.address_line, c.suburb, c.state, c.postcode,
         trim(concat(p.first_name, ' ', p.last_name)), p.mobile
  from quotes q
  join companies c on c.id = q.company_id
  left join profiles p on p.id = q.created_by
  where q.accept_token = p_token;
$$;

revoke all on function public.get_quote_by_token(uuid) from public;
grant execute on function public.get_quote_by_token(uuid) to anon, authenticated;
