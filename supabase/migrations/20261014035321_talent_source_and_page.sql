-- Why an act is on the shortlist (the night's tastes, the area's own favourites, or both) and which page of
-- Qloo's answer the list came from, so looking again can ask for a fresh set.

alter table public.talent_candidates
  add column source text not null default 'night' check (source in ('night', 'area', 'both')),
  add column search_page smallint not null default 1 check (search_page between 1 and 10);
