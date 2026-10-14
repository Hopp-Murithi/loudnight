-- A key the door app sends with each arrival, so a walk-in made offline and synced twice is counted once.
-- Ticket arrivals are already one per RSVP.
alter table public.checkins add column client_key uuid;
create unique index checkins_night_client_key_idx on public.checkins (event_night_id, client_key) where client_key is not null;
grant insert (client_key) on public.checkins to authenticated;
grant select (client_key) on public.checkins to authenticated;
