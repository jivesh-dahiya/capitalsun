-- Remaining fields to represent every selectable option and factual assertion
-- in the real CER "Sample solar retailer written statement for solar PV
-- systems" (regulation 20AH), which offers two more either/or choices beyond
-- employee/subcontractor and contract/quote-accepted, plus several fixed
-- assertions the retailer representative must personally confirm.
alter table jobs add column declaration_completion_status text;
alter table jobs add column declaration_grid_status text;
alter table jobs add column declaration_feed_in_info_provided boolean not null default false;
alter table jobs add column declaration_savings_info_provided boolean not null default false;
alter table jobs add column declaration_conflicts_disclosed boolean not null default false;
alter table jobs add column declaration_no_ineligibility boolean not null default false;
alter table jobs add column declaration_witness_name text;
alter table jobs add column declaration_witness_signature text;
alter table jobs add column declaration_witness_signed_at timestamptz;
