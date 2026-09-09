-- The follow-up date input was saving on every keystroke, so a native date
-- picker's mid-typing intermediate value (e.g. year 275760) could get
-- persisted before the fix in the app. Clear anything outside a sane range.
update leads set next_follow_up_date = null
where next_follow_up_date is not null
  and (extract(year from next_follow_up_date) < 2000 or extract(year from next_follow_up_date) > 2100);
