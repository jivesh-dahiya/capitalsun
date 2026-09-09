-- Follow-up reminders on leads, and real document/photo attachments per job
-- (via Supabase Storage), so the dashboard's "needing attention" panel and
-- document management are backed by genuine data, not placeholders.

alter table leads add column next_follow_up_date date;
alter table leads add column last_contacted_at timestamptz;

create table job_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  uploaded_at timestamptz not null default now()
);

alter table job_documents enable row level security;

create policy "company job documents" on job_documents for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

insert into storage.buckets (id, name, public)
values ('job-documents', 'job-documents', false)
on conflict (id) do nothing;

create policy "read own company documents" on storage.objects for select
  using (bucket_id = 'job-documents' and (storage.foldername(name))[1] = auth_company_id()::text);

create policy "upload own company documents" on storage.objects for insert
  with check (bucket_id = 'job-documents' and (storage.foldername(name))[1] = auth_company_id()::text);

create policy "delete own company documents" on storage.objects for delete
  using (bucket_id = 'job-documents' and (storage.foldername(name))[1] = auth_company_id()::text);
