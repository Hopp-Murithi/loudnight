-- Up to three quiet nights per venue, in the owner's order. slow_night stays as the first one so every reader of it
-- keeps working; a trigger keeps the two in step whichever one a writer sets.

alter table public.venue_settings add column quiet_nights public.weekday[] not null default '{}';
update public.venue_settings set quiet_nights = array[slow_night];

alter table public.venue_settings add constraint venue_settings_quiet_nights_shape check (
  cardinality(quiet_nights) between 1 and 3
  and quiet_nights[1] = slow_night
);

create function private.sync_quiet_nights() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if cardinality(new.quiet_nights) = 0 then
    new.quiet_nights := array[new.slow_night];
  elsif tg_op = 'UPDATE' and new.quiet_nights = old.quiet_nights and new.slow_night <> old.slow_night then
    new.quiet_nights := (array[new.slow_night] || array_remove(old.quiet_nights, new.slow_night))[1:3];
  else
    new.slow_night := new.quiet_nights[1];
  end if;
  if (select count(distinct night) from unnest(new.quiet_nights) as night) <> cardinality(new.quiet_nights) then
    raise exception 'Each quiet night can appear once.' using errcode = 'check_violation';
  end if;
  return new;
end $$;

create trigger venue_settings_sync_quiet_nights
  before insert or update of quiet_nights, slow_night on public.venue_settings
  for each row execute function private.sync_quiet_nights();

drop function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text, public.venue_host[], text
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
  p_atmosphere text default 'mixed',
  p_quiet_nights public.weekday[] default '{}'
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
     hosts, atmosphere, quiet_nights)
  values
    (v_venue_id, p_capacity, p_capabilities, p_slow_night, p_break_even_headcount, p_talent_budget_cents,
     p_average_spend_cents, p_hosts, p_atmosphere, p_quiet_nights);

  return v_venue_id;
end $$;

revoke execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text, public.venue_host[], text, public.weekday[]
) from public, anon;
grant execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text, public.venue_host[], text, public.weekday[]
) to authenticated;

-- Runs are looked up per venue and night.
create index if not exists agent_runs_venue_weekday_idx on public.agent_runs (venue_id, target_weekday, created_at desc);
