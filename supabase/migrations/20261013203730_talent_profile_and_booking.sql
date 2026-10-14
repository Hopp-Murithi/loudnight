-- A performer card needs more than a name: the public profile Qloo holds (photo, what they play, where to
-- find them), and whether the owner has booked them, which is what the launch kit builds its poster from.

alter table public.talent_candidates
  add column profile jsonb not null default '{}'::jsonb check (jsonb_typeof(profile) = 'object'),
  add column booked_at timestamptz;

create index talent_candidates_booked_idx on public.talent_candidates (concept_id) where booked_at is not null;

-- Owners and managers mark an act as booked. The existing update policy already limits this to their venues.
grant update (booked_at) on public.talent_candidates to authenticated;
