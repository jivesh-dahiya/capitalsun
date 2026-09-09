alter type job_status add value 'parked';

alter table jobs add column customer_gst_registered boolean not null default false;
alter table jobs add column designer_signature text;
alter table jobs add column designer_signed_at timestamptz;
