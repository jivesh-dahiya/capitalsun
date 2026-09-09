-- A brand-new company has no profile pointing at it yet, so the "own company" SELECT
-- policy (id = auth_company_id()) can never be satisfied by INSERT ... RETURNING.
-- Bootstrap company + profile atomically instead, via a definer function that bypasses RLS.

drop policy if exists "create own company" on companies;

create function public.create_company_profile(
  p_company_name text,
  p_first_name text,
  p_last_name text
) returns companies
language plpgsql
security definer
set search_path = public
as $$
declare
  new_company companies;
begin
  insert into companies (company_name) values (p_company_name) returning * into new_company;
  insert into profiles (id, company_id, first_name, last_name)
  values (auth.uid(), new_company.id, p_first_name, p_last_name);
  return new_company;
end;
$$;

revoke all on function public.create_company_profile(text, text, text) from public;
grant execute on function public.create_company_profile(text, text, text) to authenticated;
