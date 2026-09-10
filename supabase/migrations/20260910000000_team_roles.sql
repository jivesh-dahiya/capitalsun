-- Team roles: the person who creates a company is its owner; everyone
-- invited afterward defaults to 'member' unless the inviter picks 'admin'.
-- Owners and admins can manage the team (invite, remove, promote/demote);
-- members cannot. This is also the natural seat/ownership model a future
-- per-seat billing plan would build on.
alter table profiles add column role text not null default 'member';
alter table profiles add constraint profiles_role_check check (role in ('owner', 'admin', 'member'));

-- The very first user in a new company is its owner.
create or replace function public.create_company_profile(
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
  insert into profiles (id, company_id, first_name, last_name, role)
  values (auth.uid(), new_company.id, p_first_name, p_last_name, 'owner');
  return new_company;
end;
$$;

-- Mirrors my_company_id()'s recursion-safety note (team-visibility
-- migration): a security-definer lookup is needed here rather than a plain
-- query, since this gets called from a policy/trigger on profiles itself
-- and a plain invoker query would re-trigger that same policy.
create or replace function public.my_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from profiles where id = auth.uid();
$$;

revoke all on function public.my_role() from public;
grant execute on function public.my_role() to authenticated;

-- Lets an owner/admin edit a teammate's row (role, name, etc.) — the
-- existing "own profile update" policy only ever covers your own row.
create policy "owner or admin manage teammates" on profiles for update
  using (company_id = my_company_id() and my_role() in ('owner', 'admin'))
  with check (company_id = my_company_id());

-- RLS alone can't stop a plain member from writing their OWN row's role
-- column via the existing "own profile update" policy (id = auth.uid()),
-- since that policy has no column restriction. A trigger closes that:
-- any change to `role` must come from an owner/admin, and the owner role
-- itself can't be reassigned this way (that needs a real ownership-
-- transfer flow, which doesn't exist yet, so it's blocked entirely here
-- rather than left silently exploitable).
create or replace function public.guard_profile_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if my_role() not in ('owner', 'admin') then
      raise exception 'Only an owner or admin can change a teammate''s role.';
    end if;
    if old.role = 'owner' or new.role = 'owner' then
      raise exception 'Ownership cannot be changed this way.';
    end if;
  end if;
  return new;
end;
$$;

create trigger guard_profile_role_change
  before update on profiles
  for each row
  execute function public.guard_profile_role_change();
