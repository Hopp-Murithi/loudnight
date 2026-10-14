-- An administrator can suspend a venue, with a reason. Its team can still read everything, but nothing at the venue
-- changes through a session until it is lifted: no plans, nights, bookings, RSVPs, check-ins or settings. Only an
-- administrator may set or lift a suspension, and the audit trigger records who did and when.

alter table public.venues
  add column suspended_at timestamptz,
  add column suspended_reason text check (suspended_reason is null or length(trim(suspended_reason)) between 3 and 300),
  add column suspended_by uuid references public.profiles (id) on delete set null,
  add constraint venues_suspension_has_reason check ((suspended_at is null) = (suspended_reason is null));

create index venues_suspended_by_idx on public.venues (suspended_by);
create index venues_suspended_idx on public.venues (suspended_at) where suspended_at is not null;

grant select (suspended_at, suspended_reason) on public.venues to anon;
grant select (suspended_at, suspended_reason, suspended_by) on public.venues to authenticated;
grant update (suspended_at, suspended_reason, suspended_by) on public.venues to authenticated;

create function private.venue_suspended(p_venue_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.venues v where v.id = p_venue_id and v.suspended_at is not null)
$$;
revoke all on function private.venue_suspended(uuid) from public;
grant execute on function private.venue_suspended(uuid) to anon, authenticated;

-- Only administrators touch the suspension columns, and the one who does is recorded.
create function private.guard_venue_suspension() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if new.suspended_at is not null and not (select private.is_administrator()) then
      raise exception 'Only an administrator can suspend a venue.' using errcode = 'insufficient_privilege';
    end if;
    return new;
  end if;
  if (new.suspended_at, new.suspended_reason) is distinct from (old.suspended_at, old.suspended_reason) then
    if not (select private.is_administrator()) then
      raise exception 'Only an administrator can suspend or lift a venue.' using errcode = 'insufficient_privilege';
    end if;
    new.suspended_by := case when new.suspended_at is null then null else (select private.viewer_id()) end;
  end if;
  return new;
end $$;

create trigger venues_guard_suspension
  before insert or update on public.venues
  for each row execute function private.guard_venue_suspension();

-- While suspended, sessions write nothing at the venue. Administrators may still write, to put things right.
create policy no_update_while_suspended on public.venues as restrictive for update to anon, authenticated
  using (suspended_at is null or (select private.is_administrator()))
  with check (true);

do $$
declare
  t text;
begin
  foreach t in array array[
    'venue_settings', 'venue_members', 'agent_runs', 'concepts', 'series', 'event_nights', 'talent_candidates',
    'rsvps', 'rsvp_contacts', 'checkins', 'night_spend'
  ] loop
    execute format(
      'create policy no_insert_while_suspended on public.%I as restrictive for insert to anon, authenticated
         with check (not private.venue_suspended(venue_id) or (select private.is_administrator()))', t);
    execute format(
      'create policy no_update_while_suspended on public.%I as restrictive for update to anon, authenticated
         using (not private.venue_suspended(venue_id) or (select private.is_administrator()))
         with check (not private.venue_suspended(venue_id) or (select private.is_administrator()))', t);
  end loop;
end $$;
