-- Performers from open data (Wikidata, MusicBrainz) where Qloo knows few: poets, comedians, DJs and town musicians.
-- They join the shortlist labelled by source and can never carry a Qloo receipt they do not have.

alter table public.talent_candidates drop constraint talent_candidates_source_check;
alter table public.talent_candidates add constraint talent_candidates_source_check
  check (source in ('night', 'area', 'both', 'wikidata', 'musicbrainz'));
alter table public.talent_candidates add constraint talent_candidates_open_data_has_no_receipt
  check (source not in ('wikidata', 'musicbrainz') or (qloo_cache_id is null and cardinality(response_path) = 0));

-- Open data answers, shared across venues and read only by the server. Like Qloo answers, refreshed after a week.
create table public.open_data_cache (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('wikidata', 'musicbrainz')),
  request_hash text not null unique check (length(request_hash) = 64),
  request jsonb not null,
  response jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null
);

revoke all on public.open_data_cache from anon, authenticated;
grant all on public.open_data_cache to service_role;
alter table public.open_data_cache enable row level security;
