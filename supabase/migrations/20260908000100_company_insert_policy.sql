-- Allow a newly signed-up user to create the one company they belong to.
create policy "create own company" on companies for insert
  with check (auth.uid() is not null);
