create type job_status as enum ('new', 'assigned', 'started', 'installed');

alter table jobs add column job_status job_status not null default 'new';
alter table jobs add column customer_signature text;
alter table jobs add column installer_signature text;
alter table jobs add column customer_signed_at timestamptz;
alter table jobs add column installer_signed_at timestamptz;
