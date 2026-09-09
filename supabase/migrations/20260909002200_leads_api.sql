-- A real inbound API so an external system (the company's own website form
-- handler, a WordPress webhook, Zapier/Make, or any other CRM) can push a
-- lead straight into the pipeline, distinct from the AI chat widget.
--
-- Unlike the chat widget (where the "secret" is just an unguessable one-time
-- link a visitor is handed), this accepts calls from a company's own backend
-- infrastructure, so it's gated by a real secret API key rather than the
-- company id alone.
alter table companies add column api_key uuid not null default gen_random_uuid();

create function public.create_lead_via_api(
  p_api_key uuid,
  p_first_name text,
  p_last_name text,
  p_email text default null,
  p_mobile text default null,
  p_address_line text default null,
  p_suburb text default null,
  p_state text default null,
  p_postcode text default null,
  p_source text default 'Website',
  p_notes text default null,
  p_estimated_value numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_company_id uuid;
  new_lead_id uuid;
begin
  select id into target_company_id from companies where api_key = p_api_key;
  if target_company_id is null then
    raise exception 'Invalid API key.';
  end if;
  if p_first_name is null or length(trim(p_first_name)) = 0 then
    raise exception 'first_name is required.';
  end if;

  insert into leads (
    company_id, first_name, last_name, email, mobile,
    address_line, suburb, state, postcode, source, channel,
    notes, estimated_value
  ) values (
    target_company_id, p_first_name, coalesce(nullif(trim(p_last_name), ''), '-'), p_email, p_mobile,
    p_address_line, p_suburb, p_state, p_postcode, coalesce(p_source, 'Website'), 'api',
    p_notes, p_estimated_value
  ) returning id into new_lead_id;

  return new_lead_id;
end;
$$;

revoke all on function public.create_lead_via_api(uuid, text, text, text, text, text, text, text, text, text, text, numeric) from public;
grant execute on function public.create_lead_via_api(uuid, text, text, text, text, text, text, text, text, text, text, numeric) to anon, authenticated;
