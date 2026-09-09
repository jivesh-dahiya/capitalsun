-- Lets a company star panel models in the design tool's panel search sidebar,
-- matching the "Favourite panels" list shown in reference solar design tools.
alter table companies add column favourite_panel_ids uuid[] not null default '{}';
