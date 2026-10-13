-- A chosen night becomes a series and its four nights in one call, and talent candidates keep their receipt
-- path, the tastes they matched, and the owner's own edit of the outreach message.

alter table public.talent_candidates
  add column response_path text[] not null default '{}' check (cardinality(response_path) <= 12),
  add column fit_signals text[] not null default '{}' check (cardinality(fit_signals) <= 4),
  add column outreach_edited text check (outreach_edited is null or length(outreach_edited) <= 4000);

-- Owners and managers may reword the message. Everything else on a candidate is written by the server.
grant update (outreach_edited) on public.talent_candidates to authenticated;
create policy talent_candidates_edit_outreach on public.talent_candidates for update to authenticated
  using (venue_id in (select private.managed_venue_ids()))
  with check (venue_id in (select private.managed_venue_ids()));

create trigger talent_candidates_audit after update on public.talent_candidates
  for each row execute function private.audit_change();

-- Five rows or none. Runs with the caller's rights, so the series and night policies decide who may call it.
create function public.create_series(p_concept_id uuid, p_starts_on date, p_nights jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_venue uuid;
  v_weekday public.weekday;
  v_series uuid;
begin
  if jsonb_typeof(p_nights) is distinct from 'array' or jsonb_array_length(p_nights) <> 4 then
    raise exception 'a series has four nights' using errcode = '22023';
  end if;
  select c.venue_id, r.target_weekday into v_venue, v_weekday
    from public.concepts c join public.agent_runs r on r.id = c.run_id
    where c.id = p_concept_id and c.chosen_at is not null;
  if v_venue is null then
    raise exception 'choose the night first' using errcode = 'P0002';
  end if;
  insert into public.series (venue_id, concept_id, weekday, starts_on)
    values (v_venue, p_concept_id, v_weekday, p_starts_on)
    returning id into v_series;
  insert into public.event_nights (series_id, venue_id, sequence, starts_at, variation, public_slug)
    select v_series, v_venue, night.position::smallint, (night.value ->> 'starts_at')::timestamptz,
      night.value ->> 'variation', night.value ->> 'slug'
    from jsonb_array_elements(p_nights) with ordinality as night(value, position);
  return v_series;
end $$;

revoke execute on function public.create_series(uuid, date, jsonb) from public, anon;
grant execute on function public.create_series(uuid, date, jsonb) to authenticated, service_role;
