-- Concepts carry what the night is and needs, for scoring and the card, and the owner's choice of one per run.

create type public.concept_format as enum (
  'live_music', 'dj_night', 'screening', 'food_and_drink', 'talk', 'game', 'workshop', 'other'
);

alter table public.concepts
  add column format public.concept_format not null default 'other',
  add column needs public.venue_capability[] not null default '{}',
  add column themes text[] not null default '{}' check (cardinality(themes) <= 5),
  add column expected_audience integer check (expected_audience is null or expected_audience between 1 and 100000),
  add column chosen_at timestamptz,
  add constraint concepts_chosen_when_shortlisted check (chosen_at is null or is_shortlisted);

create unique index concepts_one_choice_per_run_idx on public.concepts (run_id) where chosen_at is not null;

-- Owners and managers choose among the shortlist. Sessions may change nothing else on a concept.
grant update (chosen_at) on public.concepts to authenticated;
create policy concepts_choose on public.concepts for update to authenticated
  using (venue_id in (select private.managed_venue_ids()) and is_shortlisted)
  with check (venue_id in (select private.managed_venue_ids()) and is_shortlisted);

create trigger concepts_audit after update on public.concepts
  for each row execute function private.audit_change();

-- One choice per run: the previous choice is cleared in the same transaction. Runs with the caller's rights.
create function public.choose_concept(p_concept_id uuid) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_run uuid;
begin
  select run_id into v_run from public.concepts where id = p_concept_id and is_shortlisted;
  if v_run is null then
    raise exception 'concept not found' using errcode = 'P0002';
  end if;
  update public.concepts set chosen_at = null
    where run_id = v_run and chosen_at is not null and id <> p_concept_id;
  update public.concepts set chosen_at = now() where id = p_concept_id;
  if not found then
    raise exception 'only owners and managers choose a night' using errcode = '42501';
  end if;
  return p_concept_id;
end $$;

revoke execute on function public.choose_concept(uuid) from public, anon;
grant execute on function public.choose_concept(uuid) to authenticated;
