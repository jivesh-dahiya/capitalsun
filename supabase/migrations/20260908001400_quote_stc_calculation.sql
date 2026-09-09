-- Auto-calculated small-scale technology certificates (STC) for solar, and a
-- simpler configurable estimate for battery certificates (BSTC), on quotes.
-- Company-level defaults so every new quote starts from the installer's own
-- assumptions rather than a value baked into the app.
alter table companies add column default_stc_price numeric(6,2) default 35;
alter table companies add column default_bstc_rate numeric(6,2) default 250;

alter table quotes add column stc_zone int;
alter table quotes add column stc_price numeric(6,2);
alter table quotes add column expected_install_year int;
alter table quotes add column stc_count int;
alter table quotes add column stc_amount numeric(10,2);

alter table quotes add column battery_capacity_kwh numeric(6,2);
alter table quotes add column bstc_rate numeric(6,2);
alter table quotes add column bstc_count int;
alter table quotes add column bstc_amount numeric(10,2);
