-- Solar design tool: satellite-based roof polygon drawing + panel layout,
-- stored against the quote it belongs to.
alter table quotes add column lat numeric;
alter table quotes add column lng numeric;
alter table quotes add column panel_model_id uuid references equipment_models (id) on delete set null;
alter table quotes add column design_data jsonb;
alter table quotes add column estimated_annual_kwh numeric;
