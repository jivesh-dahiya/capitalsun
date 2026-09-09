-- Inverter and battery selection for quotes, matching the panel selection
-- already in the solar design tool. Battery capacity for the BSTC rebate
-- estimate is now derived from the selected model + quantity rather than
-- typed in manually.
alter table quotes add column inverter_model_id uuid references equipment_models (id) on delete set null;
alter table quotes add column inverter_quantity int;
alter table quotes add column battery_model_id uuid references equipment_models (id) on delete set null;
alter table quotes add column battery_quantity int;
