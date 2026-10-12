-- Covering indexes for the composite (parent_id, venue_id) foreign keys, so cascades and joins never scan.
-- The single-column parent indexes they make redundant are dropped.

create index run_steps_run_venue_idx on public.run_steps (run_id, venue_id);
create index concepts_run_venue_idx on public.concepts (run_id, venue_id);
create index talent_candidates_concept_venue_idx on public.talent_candidates (concept_id, venue_id);
create index series_concept_venue_idx on public.series (concept_id, venue_id);
create index event_nights_series_venue_idx on public.event_nights (series_id, venue_id);
create index rsvps_night_venue_idx on public.rsvps (event_night_id, venue_id);
create index checkins_night_venue_idx on public.checkins (event_night_id, venue_id);

create index evidence_concept_venue_idx on public.evidence (concept_id, venue_id);
drop index public.evidence_concept_id_idx;
