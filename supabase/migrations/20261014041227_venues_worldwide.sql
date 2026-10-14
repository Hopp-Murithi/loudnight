-- Venues anywhere in the world: the country and town they are in, and the currency their money is counted in.
-- Amounts stay whole minor units (cents, pence, Kenyan cents) in the venue's own currency. Rows made before this read
-- as US dollars with no stored town, which is what they were.

alter table public.venues
  add column country_code text check (country_code ~ '^[A-Z]{2}$'),
  add column city text check (length(city) between 1 and 120),
  add column currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$');

-- Every venue so far was found in the United States.
update public.venues set country_code = 'US' where address ~ ', (USA|United States)$';

-- A demo page shows the town and prices; owners and managers may correct all three.
grant select (country_code, city, currency) on public.venues to anon;
grant insert (country_code, city, currency) on public.venues to authenticated;
grant update (country_code, city, currency) on public.venues to authenticated;

drop function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer
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
  p_currency text default 'USD'
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
    (venue_id, capacity, capabilities, slow_night, break_even_headcount, talent_budget_cents, average_spend_cents)
  values
    (v_venue_id, p_capacity, p_capabilities, p_slow_night, p_break_even_headcount, p_talent_budget_cents, p_average_spend_cents);

  return v_venue_id;
end $$;

revoke execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text
) from public, anon;
grant execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer, text, text, text
) to authenticated;
