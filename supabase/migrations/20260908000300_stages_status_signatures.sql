-- Expand the pipeline to match Bridge Select's real stage list, add an independent
-- on-the-ground job status, and columns to hold captured signatures.

alter type job_stage add value 'missed';
alter type job_stage add value 'complete';
alter type job_stage add value 'waiting_for_approval';
alter type job_stage add value 'resubmitted';
alter type job_stage add value 'cannot_trade';
alter type job_stage add value 'approved';
