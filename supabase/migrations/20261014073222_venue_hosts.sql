-- What a room can host (live music, DJs, poetry, comedy and so on) and whether it is seated or standing, so the
-- planner proposes only nights the room suits and the performer search looks for the right kind of act.

create type public.venue_host as enum (
  'live_music', 'dj_dancing', 'poetry', 'comedy', 'seated_sets', 'quiz_games', 'talks', 'film'
);

alter table public.venue_settings
  add column hosts public.venue_host[] not null default '{}' check (cardinality(hosts) <= 8),
  add column atmosphere text not null default 'mixed' check (atmosphere in ('seated', 'standing', 'mixed'));

drop function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text
);

-- A venue and its settings commit together or not at all. Security invoker, so row level security still decides.
create function public.create_venue(
  p_name text,
  p_address text,
  p_google_place_id text,
  p_latitude numeric,
  p_longitude numeric,
  p_venue_type public.venue_type,
  p_time_zone text,
  p_capacity integer,
  p_capabilities public.venue_capability[],
  p_slow_night public.weekday,
  p_break_even_headcount integer,
  p_talent_budget_cents integer,
  p_average_spend_cents integer,
  p_country_code text default null,
  p_city text default null,
  p_currency text default 'USD',
  p_hosts public.venue_host[] default '{}',
  p_atmosphere text default 'mixed'
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_venue_id uuid;
begin
  insert into public.venues
    (created_by, name, address, google_place_id, latitude, longitude, venue_type, time_zone, country_code, city, currency)
  values
    ((select auth.uid()), p_name, p_address, p_google_place_id, p_latitude, p_longitude, p_venue_type, p_time_zone,
     p_country_code, p_city, p_currency)
  returning id into v_venue_id;

  insert into public.venue_settings
    (venue_id, capacity, capabilities, slow_night, break_even_headcount, talent_budget_cents, average_spend_cents,
     hosts, atmosphere)
  values
    (v_venue_id, p_capacity, p_capabilities, p_slow_night, p_break_even_headcount, p_talent_budget_cents,
     p_average_spend_cents, p_hosts, p_atmosphere);

  return v_venue_id;
end $$;

revoke execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text, public.venue_host[], text
) from public, anon;
grant execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text, public.venue_host[], text
) to authenticated;
