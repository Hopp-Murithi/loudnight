-- Identity and tenancy: profiles, venues (tenants), venue team, venue settings, audit log, access helpers.
-- Helpers resolve the viewer through private.viewer_id(), so an administrator's "Preview as" (plan 08)
-- scopes every policy as the previewed person without touching the policies themselves.

create extension if not exists moddatetime schema extensions;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- Platform role. Administrators run Encore; everyone else is an owner of zero or more venues.
create type public.app_role as enum ('owner', 'administrator');

-- Role inside one venue. Door staff check guests in and never see money.
create type public.venue_role as enum ('owner', 'manager', 'door');

create type public.weekday as enum ('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');

create type public.venue_type as enum ('bar', 'cafe', 'restaurant', 'music_venue', 'other');

create type public.venue_capability as enum ('stage', 'screen', 'sound_system', 'kitchen', 'outdoor_space', 'dance_floor');

-- One profile per auth user, anonymous ones included. The role lives here, never in user-editable metadata.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or length(trim(display_name)) between 1 and 80),
  role public.app_role not null default 'owner',
  is_anonymous boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_administrators_idx on public.profiles (id) where role = 'administrator';

-- Tenants. The public face of a venue: what an event page may show to anyone.
-- Demo venues have no team and are maintained by the server, so judges can open them without an account.
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles (id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 120),
  address text not null check (length(trim(address)) between 1 and 300),
  google_place_id text check (google_place_id is null or length(google_place_id) <= 300),
  latitude numeric(9, 6) not null check (latitude between -90 and 90),
  longitude numeric(9, 6) not null check (longitude between -180 and 180),
  venue_type public.venue_type not null default 'bar',
  time_zone text not null default 'America/New_York' check (length(time_zone) between 1 and 64),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index venues_created_by_idx on public.venues (created_by);
create index venues_demo_idx on public.venues (id) where is_demo;

-- Who works at a venue. Exactly one owner; the creator becomes it in the same transaction.
create table public.venue_members (
  venue_id uuid not null references public.venues (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.venue_role not null,
  added_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (venue_id, user_id)
);
create index venue_members_user_id_idx on public.venue_members (user_id, venue_id);
create index venue_members_added_by_idx on public.venue_members (added_by);
create unique index venue_members_one_owner_idx on public.venue_members (venue_id) where role = 'owner';

-- What only the venue's managers see: money, capacity and the night to fill.
create table public.venue_settings (
  venue_id uuid primary key references public.venues (id) on delete cascade,
  capacity integer not null check (capacity between 1 and 100000),
  capabilities public.venue_capability[] not null default '{}',
  slow_night public.weekday not null,
  break_even_headcount integer not null check (break_even_headcount between 1 and 100000),
  talent_budget_cents integer not null default 0 check (talent_budget_cents between 0 and 100000000),
  average_spend_cents integer not null default 2000 check (average_spend_cents between 0 and 10000000),
  search_radius_m integer not null default 2000 check (search_radius_m between 250 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Append-only record of who changed what. No foreign keys, so history outlives the rows it describes.
create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  venue_id uuid,
  action text not null check (length(action) between 1 and 80),
  subject_type text not null,
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_log_venue_id_created_at_idx on public.audit_log (venue_id, created_at desc);

create trigger profiles_touch_updated_at before update on public.profiles
  for each row execute function extensions.moddatetime(updated_at);
create trigger venues_touch_updated_at before update on public.venues
  for each row execute function extensions.moddatetime(updated_at);
create trigger venue_settings_touch_updated_at before update on public.venue_settings
  for each row execute function extensions.moddatetime(updated_at);

create function private.forbid_mutation() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception '% is append-only', tg_table_name;
end $$;

create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function private.forbid_mutation();

-- The person whose view this request reads as. It differs from auth.uid() only when a real, active
-- administrator previews an active non-administrator through the x-encore-preview header.
create function private.viewer_id() returns uuid
language plpgsql stable security definer set search_path = '' as $$
declare
  requested text := nullif(current_setting('request.headers', true), '')::json ->> 'x-encore-preview';
  target uuid;
begin
  if requested is null or requested !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return (select auth.uid());
  end if;
  select t.id into target from public.profiles t
  where t.id = requested::uuid and t.is_active and t.role <> 'administrator'
    and exists (
      select 1 from public.profiles me
      where me.id = (select auth.uid()) and me.is_active and me.role = 'administrator'
    );
  return coalesce(target, (select auth.uid()));
end $$;

create function private.previewing() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select private.viewer_id()) is distinct from (select auth.uid())
$$;

create function private.is_administrator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select private.viewer_id()) and p.is_active and p.role = 'administrator'
  )
$$;

-- Venues where the viewer holds one of the given roles. Administrators hold every role everywhere.
create function private.venue_ids_with_role(roles public.venue_role[]) returns setof uuid
language sql stable security definer set search_path = '' as $$
  select m.venue_id from public.venue_members m
  join public.profiles p on p.id = m.user_id and p.is_active
  where m.user_id = (select private.viewer_id()) and m.role = any (roles)
  union
  select v.id from public.venues v where (select private.is_administrator())
$$;

create function private.member_venue_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select private.venue_ids_with_role('{owner,manager,door}')
$$;

create function private.managed_venue_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select private.venue_ids_with_role('{owner,manager}')
$$;

create function private.owner_venue_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select private.venue_ids_with_role('{owner}')
$$;

-- Venues the viewer may read: every demo venue plus the venues they work at.
create function private.readable_venue_ids() returns setof uuid
language sql stable security definer set search_path = '' as $$
  select v.id from public.venues v where v.is_demo
  union
  select private.member_venue_ids()
$$;

revoke execute on all functions in schema private from public;
grant execute on function
  private.viewer_id(), private.previewing(), private.is_administrator(),
  private.venue_ids_with_role(public.venue_role[]), private.member_venue_ids(), private.managed_venue_ids(),
  private.owner_venue_ids(), private.readable_venue_ids()
  to anon, authenticated, service_role;

-- Every auth user gets a profile in the same transaction. Administrators are made only through app_metadata.
create function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role, is_anonymous)
  values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), ''),
    case when new.raw_app_meta_data ->> 'role' = 'administrator' then 'administrator' else 'owner' end::public.app_role,
    coalesce(new.is_anonymous, false)
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- An anonymous visitor who adds an email keeps their venues; the profile follows.
create function private.handle_user_upgraded() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set is_anonymous = coalesce(new.is_anonymous, false) where id = new.id;
  return new;
end $$;

create trigger on_auth_user_upgraded after update of is_anonymous on auth.users
  for each row when (old.is_anonymous is distinct from new.is_anonymous)
  execute function private.handle_user_upgraded();

-- Keeps the routing hint in the token in step with the profile.
create function private.sync_app_metadata() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update auth.users
  set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object('role', new.role, 'is_active', new.is_active)
  where id = new.id;
  return new;
end $$;

create trigger profiles_sync_app_metadata after insert or update of role, is_active on public.profiles
  for each row execute function private.sync_app_metadata();

-- The person who creates a venue owns it, in the same statement.
create function private.add_venue_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.created_by is not null and not new.is_demo then
    insert into public.venue_members (venue_id, user_id, role, added_by)
    values (new.id, new.created_by, 'owner', new.created_by);
  end if;
  return new;
end $$;

create trigger venues_add_owner after insert on public.venues
  for each row execute function private.add_venue_owner();

-- Changes made under a user session are audited in the same transaction. Only ids and column names are kept.
create function private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_row jsonb := to_jsonb(coalesce(new, old));
  v_changed text[];
begin
  if tg_op = 'UPDATE' then
    select array_agg(n.key order by n.key) into v_changed
    from jsonb_each(to_jsonb(new)) n
    where n.key <> 'updated_at' and n.value is distinct from (to_jsonb(old) -> n.key);
    if v_changed is null then
      return new;
    end if;
  end if;

  insert into public.audit_log (actor_id, venue_id, action, subject_type, subject_id, metadata)
  values (
    (select auth.uid()),
    coalesce((v_row ->> 'venue_id')::uuid, case when tg_table_name = 'venues' then (v_row ->> 'id')::uuid end),
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    coalesce((v_row ->> 'id')::uuid, (v_row ->> 'user_id')::uuid, (v_row ->> 'venue_id')::uuid),
    case when v_changed is null then '{}'::jsonb else jsonb_build_object('changed', v_changed) end
  );
  return coalesce(new, old);
end $$;

create trigger venues_audit after insert or update or delete on public.venues
  for each row execute function private.audit_change();
create trigger venue_members_audit after insert or update or delete on public.venue_members
  for each row execute function private.audit_change();
create trigger venue_settings_audit after insert or update on public.venue_settings
  for each row execute function private.audit_change();
