-- Demo venues for judges: three fictional venues in real US neighbourhoods, open without an account.
-- Their plans are precomputed by the real pipeline (plan 04), never typed in here, so every number keeps its receipt.
-- Safe to run again.

insert into public.venues (id, name, address, latitude, longitude, venue_type, time_zone, is_demo) values
  ('8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0001', 'The Copper Room', '214 Bedford Ave, Brooklyn, NY 11249', 40.717400, -73.957500, 'bar', 'America/New_York', true),
  ('8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0002', 'Eastside Social', '1100 E 6th St, Austin, TX 78702', 30.262400, -97.729600, 'music_venue', 'America/Chicago', true),
  ('8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0003', 'Logan Corner Cafe', '2600 N Milwaukee Ave, Chicago, IL 60647', 41.929200, -87.708600, 'cafe', 'America/Chicago', true)
on conflict (id) do update set
  name = excluded.name,
  address = excluded.address,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  venue_type = excluded.venue_type,
  time_zone = excluded.time_zone;

insert into public.venue_settings
  (venue_id, capacity, capabilities, slow_night, break_even_headcount, talent_budget_cents, average_spend_cents)
values
  ('8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0001', 90, '{stage,sound_system,screen}', 'tuesday', 40, 30000, 2000),
  ('8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0002', 180, '{stage,sound_system,dance_floor,outdoor_space}', 'wednesday', 70, 60000, 2500),
  ('8f6a1f8e-2c1b-4c55-9d2e-0b7a3c1e0003', 45, '{kitchen,screen}', 'monday', 25, 15000, 1400)
on conflict (venue_id) do update set
  capacity = excluded.capacity,
  capabilities = excluded.capabilities,
  slow_night = excluded.slow_night,
  break_even_headcount = excluded.break_even_headcount,
  talent_budget_cents = excluded.talent_budget_cents,
  average_spend_cents = excluded.average_spend_cents;
