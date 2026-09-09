-- 24/7 AI-style lead intake: a public guided-chat widget that qualifies a
-- website visitor, estimates a system size, scores the lead, and creates it
-- immediately (rather than waiting for a human the next morning).
alter table leads add column channel text not null default 'manual';
alter table leads add column job_interest text;
alter table leads add column avg_monthly_bill numeric(10,2);
alter table leads add column estimated_system_kw numeric(6,2);
alter table leads add column lead_score int;
alter table leads add column appointment_at timestamptz;
alter table leads add column ai_qualified boolean not null default false;
alter table leads add column chat_transcript jsonb;

alter table companies add column chat_widget_enabled boolean not null default true;

-- Public, unauthenticated submission from the chat widget — same security
-- model as accept_quote: security definer, no direct table grant to anon.
-- The company id is not sensitive (it's the whole point of a public intake
-- link), but every other field is fully attacker-controlled input, so this
-- function only ever creates a new lead row scoped to that company; it can't
-- read or modify anything else.
create function public.create_lead_from_widget(
  p_company_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text,
  p_mobile text,
  p_address_line text,
  p_suburb text,
  p_state text,
  p_postcode text,
  p_job_interest text,
  p_avg_monthly_bill numeric,
  p_estimated_system_kw numeric,
  p_lead_score int,
  p_appointment_at timestamptz,
  p_chat_transcript jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_lead_id uuid;
begin
  if not exists (select 1 from companies where id = p_company_id and chat_widget_enabled) then
    raise exception 'Chat intake is not available for this company.';
  end if;

  insert into leads (
    company_id, first_name, last_name, email, mobile,
    address_line, suburb, state, postcode, source, channel,
    job_interest, avg_monthly_bill, estimated_system_kw, lead_score,
    appointment_at, ai_qualified, chat_transcript, estimated_value
  ) values (
    p_company_id, p_first_name, p_last_name, p_email, p_mobile,
    p_address_line, p_suburb, p_state, p_postcode, 'Website chat', 'website_chat',
    p_job_interest, p_avg_monthly_bill, p_estimated_system_kw, p_lead_score,
    p_appointment_at, true, p_chat_transcript,
    case when p_estimated_system_kw is not null then p_estimated_system_kw * 1300 else null end
  ) returning id into new_lead_id;

  return new_lead_id;
end;
$$;

revoke all on function public.create_lead_from_widget(uuid, text, text, text, text, text, text, text, text, text, numeric, numeric, int, timestamptz, jsonb) from public;
grant execute on function public.create_lead_from_widget(uuid, text, text, text, text, text, text, text, text, text, numeric, numeric, int, timestamptz, jsonb) to anon, authenticated;

-- Public read of just enough company info to render the widget (name, logo)
-- — same "public by design" reasoning as the intake function above.
create function public.get_company_public_info(p_company_id uuid)
returns table (company_name text, logo_url text, chat_widget_enabled boolean)
language sql
security definer
set search_path = public
as $$
  select company_name, logo_url, chat_widget_enabled from companies where id = p_company_id;
$$;

revoke all on function public.get_company_public_info(uuid) from public;
grant execute on function public.get_company_public_info(uuid) to anon, authenticated;
