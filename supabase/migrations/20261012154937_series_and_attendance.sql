-- The chosen concept becomes a four-week series. Guests RSVP and check in; the next night adapts.

create type public.series_status as enum ('draft', 'launched', 'ended');

create type public.night_status as enum ('draft', 'published', 'cancelled');

create type public.night_decision as enum ('keep', 'tweak', 'swap');

create table public.series (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null,
  concept_id uuid not null unique,
  weekday public.weekday not null,
  starts_on date not null,
  status public.series_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint series_id_venue_key unique (id, venue_id),
  foreign key (concept_id, venue_id) references public.concepts (id, venue_id) on delete cascade
);
create index series_venue_id_idx on public.series (venue_id);

create table public.event_nights (
  id uuid primary key default gen_random_uuid(),
  series_id uuid not null,
  venue_id uuid not null,
  sequence smallint not null check (sequence between 1 and 4),
  starts_at timestamptz not null,
  variation text not null check (length(trim(variation)) between 1 and 400),
  assets jsonb not null default '{}'::jsonb check (jsonb_typeof(assets) = 'object'),
  public_slug text not null unique check (public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(public_slug) between 6 and 80),
  status public.night_status not null default 'draft',
  decision public.night_decision,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint event_nights_id_venue_key unique (id, venue_id),
  constraint event_nights_series_sequence_key unique (series_id, sequence),
  constraint event_nights_decision_dated check ((decision is null) = (decided_at is null)),
  foreign key (series_id, venue_id) references public.series (id, venue_id) on delete cascade
);
create index event_nights_venue_starts_idx on public.event_nights (venue_id, starts_at);
create index event_nights_published_venue_idx on public.event_nights (venue_id) where status = 'published';

-- Guests are not signed in. Contact details are readable only by the venue.
create table public.rsvps (
  id uuid primary key default gen_random_uuid(),
  event_night_id uuid not null,
  venue_id uuid not null,
  guest_name text not null check (length(trim(guest_name)) between 1 and 80),
  guest_contact text check (guest_contact is null or length(trim(guest_contact)) between 3 and 120),
  party_size smallint not null default 1 check (party_size between 1 and 10),
  checkin_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  created_at timestamptz not null default now(),
  constraint rsvps_id_night_key unique (id, event_night_id),
  foreign key (event_night_id, venue_id) references public.event_nights (id, venue_id) on delete cascade
);
create index rsvps_venue_id_idx on public.rsvps (venue_id);
create index rsvps_night_created_idx on public.rsvps (event_night_id, created_at);
create unique index rsvps_night_contact_key on public.rsvps (event_night_id, lower(guest_contact))
  where guest_contact is not null;

-- One row per arrival at the door. Spend is logged later by the owner, if at all.
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  event_night_id uuid not null,
  venue_id uuid not null,
  rsvp_id uuid unique,
  party_size smallint not null default 1 check (party_size between 1 and 10),
  spend_cents integer check (spend_cents is null or spend_cents between 0 and 100000000),
  created_at timestamptz not null default now(),
  foreign key (event_night_id, venue_id) references public.event_nights (id, venue_id) on delete cascade,
  foreign key (rsvp_id, event_night_id) references public.rsvps (id, event_night_id) on delete set null (rsvp_id)
);
create index checkins_night_created_idx on public.checkins (event_night_id, created_at);
create index checkins_venue_id_idx on public.checkins (venue_id);
create index checkins_rsvp_night_idx on public.checkins (rsvp_id, event_night_id);

create trigger series_touch_updated_at before update on public.series
  for each row execute function extensions.moddatetime(updated_at);
create trigger event_nights_touch_updated_at before update on public.event_nights
  for each row execute function extensions.moddatetime(updated_at);

create trigger series_audit after insert or update or delete on public.series
  for each row execute function private.audit_change();
create trigger event_nights_audit after insert or update or delete on public.event_nights
  for each row execute function private.audit_change();

-- The owner's door dashboard updates live as guests arrive.
alter publication supabase_realtime add table public.rsvps, public.checkins;
