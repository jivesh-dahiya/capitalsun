-- Bridge Select clone: core schema
-- One "company" (retailer) per tenant, with team members, installers, jobs, and inventory.

create extension if not exists "pgcrypto";

create type job_type as enum ('solar_pv_battery', 'hot_water', 'battery_only', 'aircon', 'ev_charger');
create type job_stage as enum ('site_inspection', 'in_progress', 'parking_lot', 'submitted', 'information_requested', 'failed', 'cancelled', 'planner');
create type equipment_category as enum ('panel', 'inverter', 'battery');
create type inventory_status as enum ('unverified', 'verified', 'assigned');

create table companies (
  id uuid primary key default gen_random_uuid(),
  legal_entity_name text,
  company_name text,
  abn text,
  director_name text,
  director_email text,
  gst_registered boolean default false,
  email text,
  mobile text,
  logo_url text,
  address_line text,
  suburb text,
  state text,
  postcode text,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid references companies (id) on delete cascade,
  first_name text,
  last_name text,
  mobile text,
  created_at timestamptz not null default now()
);

create table installers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  roles text[] not null default '{}',
  accreditation_number text,
  electrician_license_number text,
  status text not null default 'Connected',
  created_at timestamptz not null default now()
);

create table manufacturers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category equipment_category not null
);

create table equipment_models (
  id uuid primary key default gen_random_uuid(),
  manufacturer_id uuid not null references manufacturers (id) on delete cascade,
  name text not null,
  category equipment_category not null
);

create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  installer_id uuid references installers (id) on delete set null,
  po_number text,
  customer_type text not null default 'Individual',
  first_name text not null,
  last_name text not null,
  email text,
  mobile text,
  phone text,
  address_line text,
  suburb text,
  state text,
  postcode text,
  job_type job_type not null default 'solar_pv_battery',
  stage job_stage not null default 'site_inspection',
  status_label text not null default 'STARTED',
  progress_percent int not null default 0,
  system_size_kw numeric(6,3),
  stc_count int,
  stc_amount numeric(10,2) default 0,
  stc_price_per numeric(10,2) default 0,
  stc_paid boolean default false,
  bstc_count int,
  bstc_amount numeric(10,2) default 0,
  bstc_price_per numeric(10,2) default 0,
  bstc_paid boolean default false,
  installer_presence_start boolean default true,
  installer_presence_middle boolean default true,
  installer_presence_end boolean default true,
  installation_date date,
  labels text[] not null default '{}',
  comments text,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now()
);

create table job_equipment (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs (id) on delete cascade,
  category equipment_category not null,
  manufacturer_id uuid references manufacturers (id),
  model_id uuid references equipment_models (id),
  quantity int not null default 1
);

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  manufacturer_id uuid references manufacturers (id),
  model_id uuid references equipment_models (id),
  serial_number text not null,
  wattage_kw numeric(6,3),
  pallet_number text,
  status inventory_status not null default 'unverified',
  job_id uuid references jobs (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Row Level Security: every row is scoped to the caller's company via profiles.company_id
alter table companies enable row level security;
alter table profiles enable row level security;
alter table installers enable row level security;
alter table jobs enable row level security;
alter table job_equipment enable row level security;
alter table inventory_items enable row level security;
alter table manufacturers enable row level security;
alter table equipment_models enable row level security;

create function auth_company_id() returns uuid
language sql stable
as $$
  select company_id from profiles where id = auth.uid();
$$;

create policy "own company" on companies for select using (id = auth_company_id());
create policy "own company update" on companies for update using (id = auth_company_id());

create policy "own profile" on profiles for select using (id = auth.uid());
create policy "own profile update" on profiles for update using (id = auth.uid());
create policy "own profile insert" on profiles for insert with check (id = auth.uid());

create policy "company installers" on installers for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

create policy "company jobs" on jobs for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

create policy "company job equipment" on job_equipment for all
  using (job_id in (select id from jobs where company_id = auth_company_id()))
  with check (job_id in (select id from jobs where company_id = auth_company_id()));

create policy "company inventory" on inventory_items for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());

create policy "manufacturers readable" on manufacturers for select using (true);
create policy "models readable" on equipment_models for select using (true);
