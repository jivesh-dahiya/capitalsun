-- The new-lead salesperson alert needs Postgres change events for leads,
-- same as jobs already gets for its own realtime sync.
alter publication supabase_realtime add table leads;
