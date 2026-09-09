-- Lets teammates in the same company see each other on the new Team panel
-- (previously a profile was only visible to the user it belonged to).
--
-- auth_company_id() can't be reused here: it queries profiles itself, and
-- since it's a plain invoker function, calling it from a policy ON profiles
-- would re-trigger that same policy on its own inner query, recursing
-- forever. A dedicated security-definer function sidesteps that by running
-- its inner lookup with RLS bypassed.
create function public.my_company_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select company_id from profiles where id = auth.uid();
$$;

revoke all on function public.my_company_id() from public;
grant execute on function public.my_company_id() to authenticated;

create policy "company teammates" on profiles for select
  using (company_id = my_company_id());
