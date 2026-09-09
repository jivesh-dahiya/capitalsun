-- "Series" is a real CEC registry column for inverters and batteries (not
-- captured in the original import) — used to show a richer second line in
-- equipment pickers, similar to how the CEC's own product listings group by
-- series. Panels' CSV has no equivalent column, so it stays null there.
alter table equipment_models add column series text;
