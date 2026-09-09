-- Fields needed for the full tabbed job editor (Customer / System / Install /
-- Documents / Retailer Declaration / Notes & RFIs), matching the real Bridge
-- Select product's workflow and the Clean Energy Regulator's actual solar
-- retailer written statement requirements (regulation 20AH).

-- Customer Details tab: separate installation address, CRM linkage, signature method.
alter table jobs add column install_same_as_owner boolean not null default true;
alter table jobs add column install_address_line text;
alter table jobs add column install_suburb text;
alter table jobs add column install_state text;
alter table jobs add column install_postcode text;
alter table jobs add column crm_id text;
alter table jobs add column customer_signature_method text not null default 'installer_app';
alter table jobs add column solar_vic_eligible boolean not null default false;

-- System Details tab: warranty and grid/battery connection.
alter table jobs add column warranty_years int;
alter table jobs add column warranty_description text;
alter table jobs add column grid_connection_type text not null default 'no_battery';
alter table jobs add column battery_location text;

-- Install Details tab: property/meter identifiers and install-day specifics.
alter table jobs add column nmi_number text;
alter table jobs add column distributor_job_reference text;
alter table jobs add column meter_number text;
alter table jobs add column distributor text;
alter table jobs add column storey_type text default 'Single';
alter table jobs add column property_type text;
alter table jobs add column property_name text;
alter table jobs add column system_type text not null default 'sgu_solar_deemed';
alter table jobs add column install_ampm text;
alter table jobs add column stc_deeming_period text;
alter table jobs add column system_mounting_type text;
alter table jobs add column special_instructions_to_installer text;
alter table jobs add column ever_installed_before boolean;
alter table jobs add column additional_install_comments text;
alter table jobs add column cec_accreditation_statement boolean not null default true;
alter table jobs add column siting_approvals_statement boolean not null default true;
alter table jobs add column electrical_safety_statement boolean not null default true;
alter table jobs add column anz_standards_statement boolean not null default true;

-- Retailer Declaration tab: the real CER-mandated written statement
-- (see cer.gov.au "Sample solar retailer written statement for solar PV systems").
alter table jobs add column declaration_installer_relationship text;
alter table jobs add column declaration_performance_basis text;
alter table jobs add column declaration_accepted boolean not null default false;
alter table jobs add column declaration_signed_by_name text;
alter table jobs add column declaration_position text;
alter table jobs add column declaration_signature text;
alter table jobs add column declaration_signed_at timestamptz;

-- Documents & Photos tab: categorize uploads the way the real workflow does.
alter table job_documents add column doc_type text not null default 'other';

-- Notes & RFIs tab.
create table job_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies (id) on delete cascade,
  job_id uuid not null references jobs (id) on delete cascade,
  type text not null default 'note',
  body text not null,
  author_name text,
  created_at timestamptz not null default now()
);

alter table job_notes enable row level security;

create policy "company job notes" on job_notes for all
  using (company_id = auth_company_id()) with check (company_id = auth_company_id());
