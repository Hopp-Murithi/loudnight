-- Accounts and venue creation: sign-in emails on profiles, one-transaction venue creation, and a rate limiter.

-- The sign-in email, kept in step with auth.users, so a venue team can see who is who.
alter table public.profiles add column email text check (email is null or length(email) <= 320);
create index profiles_email_lower_idx on public.profiles (lower(email));

update public.profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role, is_anonymous, email)
  values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), ''),
    case when new.raw_app_meta_data ->> 'role' = 'administrator' then 'administrator' else 'owner' end::public.app_role,
    coalesce(new.is_anonymous, false),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end $$;

create function private.sync_profile_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function private.sync_profile_email();

revoke execute on function private.sync_profile_email() from public;

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
  p_average_spend_cents integer
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_venue_id uuid;
begin
  insert into public.venues (created_by, name, address, google_place_id, latitude, longitude, venue_type, time_zone)
  values ((select auth.uid()), p_name, p_address, p_google_place_id, p_latitude, p_longitude, p_venue_type, p_time_zone)
  returning id into v_venue_id;

  insert into public.venue_settings
    (venue_id, capacity, capabilities, slow_night, break_even_headcount, talent_budget_cents, average_spend_cents)
  values
    (v_venue_id, p_capacity, p_capabilities, p_slow_night, p_break_even_headcount, p_talent_budget_cents, p_average_spend_cents);

  return v_venue_id;
end $$;

revoke execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer
) from public, anon;
grant execute on function public.create_venue(
  text, text, text, numeric, numeric, public.venue_type, text, integer, public.venue_capability[], public.weekday,
  integer, integer, integer
) to authenticated;

-- Rate limiting for public and costly endpoints. Buckets hold a route and a hashed IP, never a raw address.
create table private.rate_limit_hits (
  bucket text not null check (length(bucket) between 1 and 200),
  hit_at timestamptz not null default now()
);
create index rate_limit_hits_bucket_hit_at_idx on private.rate_limit_hits (bucket, hit_at);
alter table private.rate_limit_hits enable row level security;
revoke all on private.rate_limit_hits from public, anon, authenticated;

-- Counts the bucket's hits in the window and records one more if there is room. A lock per bucket keeps it exact.
create function private.consume_rate_limit(p_bucket text, p_max_hits integer, p_window_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare
  v_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_bucket, 0));
  delete from private.rate_limit_hits
  where bucket = p_bucket and hit_at < now() - make_interval(secs => p_window_seconds);
  select count(*) into v_count from private.rate_limit_hits where bucket = p_bucket;
  if v_count >= p_max_hits then
    return false;
  end if;
  insert into private.rate_limit_hits (bucket) values (p_bucket);
  return true;
end $$;

revoke execute on function private.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function private.consume_rate_limit(text, integer, integer) to service_role;

-- The server's door to the limiter. No browser session may call it.
create function public.consume_rate_limit(bucket text, max_hits integer, window_seconds integer) returns boolean
language sql security invoker set search_path = '' as $$
  select private.consume_rate_limit(bucket, max_hits, window_seconds)
$$;

revoke execute on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
