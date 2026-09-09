-- Live updates: when any job in this company is created or moves, every open
-- session (map, dashboard, jobs list) reflects it immediately, no refresh needed.
alter publication supabase_realtime add table jobs;
