-- Only the venue's team checks guests in, and only on the night: from the start of the night's day in the venue's
-- time until eight hours after it begins. Guests can no longer add arrivals themselves.
revoke insert on public.checkins from anon;

drop policy checkins_insert on public.checkins;
create policy checkins_insert on public.checkins for insert to authenticated
  with check (
    venue_id in (select private.managed_venue_ids())
    or (spend_cents is null and venue_id in (select private.member_venue_ids()))
  );

create function private.checkin_on_the_night() returns trigger
  language plpgsql security invoker set search_path = '' as $$
declare
  night record;
begin
  select n.status, n.starts_at, v.time_zone into night
  from public.event_nights n join public.venues v on v.id = n.venue_id
  where n.id = new.event_night_id;
  if night.status is distinct from 'published'
    or now() < ((night.starts_at at time zone night.time_zone)::date)::timestamp at time zone night.time_zone
    or now() > night.starts_at + interval '8 hours' then
    raise exception 'check-ins are open only on the night' using errcode = 'EA410';
  end if;
  return new;
end $$;

create trigger checkins_on_the_night before insert on public.checkins
  for each row execute function private.checkin_on_the_night();
