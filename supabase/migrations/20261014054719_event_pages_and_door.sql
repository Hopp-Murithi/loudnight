-- Event pages, RSVPs and the door (plans 12 and 13).
-- A published night carries its own public face (title, description, lineup), so its page reads nothing private.
-- Cancelled nights stay readable so guests see the notice. Guest contacts move to their own table that only owners
-- and managers can read: door staff see names and party sizes, never contacts. A night's total spend lives in its
-- own managers-only table, never on the night, which guests can read. Guests may check themselves in only around
-- the night's start.

alter table public.event_nights
  add column title text check (title is null or length(trim(title)) between 1 and 120),
  add column blurb text check (blurb is null or length(blurb) <= 400),
  add column lineup text[] not null default '{}' check (cardinality(lineup) <= 8),
  add column published_at timestamptz;

drop policy event_nights_select on public.event_nights;
create policy event_nights_select on public.event_nights for select to anon, authenticated
  using (status in ('published', 'cancelled') or venue_id in (select private.readable_venue_ids()));

drop policy venues_select on public.venues;
create policy venues_select on public.venues for select to anon, authenticated
  using (
    id in (select private.readable_venue_ids())
    or created_by = (select private.viewer_id())
    or exists (
      select 1 from public.event_nights n where n.venue_id = venues.id and n.status in ('published', 'cancelled')
    )
  );

drop index public.event_nights_published_venue_idx;
create index event_nights_public_venue_idx on public.event_nights (venue_id) where status in ('published', 'cancelled');

-- Contacts leave the guest list. No RSVP has been taken yet, so nothing is carried across.
drop index public.rsvps_night_contact_key;
alter table public.rsvps drop column guest_contact;
revoke insert on public.rsvps from anon, authenticated;
grant insert (id, event_night_id, venue_id, guest_name, party_size, checkin_code) on public.rsvps to anon, authenticated;

create table public.rsvp_contacts (
  rsvp_id uuid primary key,
  event_night_id uuid not null,
  venue_id uuid not null,
  contact text not null check (length(trim(contact)) between 3 and 120),
  created_at timestamptz not null default now(),
  foreign key (rsvp_id, event_night_id) references public.rsvps (id, event_night_id) on delete cascade,
  foreign key (event_night_id, venue_id) references public.event_nights (id, venue_id) on delete cascade
);
create index rsvp_contacts_venue_id_idx on public.rsvp_contacts (venue_id);
create index rsvp_contacts_rsvp_night_idx on public.rsvp_contacts (rsvp_id, event_night_id);
create index rsvp_contacts_night_venue_idx on public.rsvp_contacts (event_night_id, venue_id);
create unique index rsvp_contacts_night_contact_key on public.rsvp_contacts (event_night_id, lower(contact));

alter table public.rsvp_contacts enable row level security;
-- Supabase grants every role everything on a new table by default; start from nothing, then grant what is needed.
revoke all on public.rsvp_contacts from anon, authenticated;
grant all on public.rsvp_contacts to service_role;
grant insert (rsvp_id, event_night_id, venue_id, contact) on public.rsvp_contacts to anon, authenticated;
grant select, delete on public.rsvp_contacts to authenticated;

create policy rsvp_contacts_insert_published on public.rsvp_contacts for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.event_nights n
      where n.id = rsvp_contacts.event_night_id and n.venue_id = rsvp_contacts.venue_id and n.status = 'published'
    )
  );
create policy rsvp_contacts_select_managed on public.rsvp_contacts for select to authenticated
  using (venue_id in (select private.managed_venue_ids()));
create policy rsvp_contacts_delete_managed on public.rsvp_contacts for delete to authenticated
  using (venue_id in (select private.managed_venue_ids()));

create policy no_insert_while_previewing on public.rsvp_contacts as restrictive for insert to authenticated
  with check (not (select private.previewing()));
create policy no_update_while_previewing on public.rsvp_contacts as restrictive for update to authenticated
  using (not (select private.previewing())) with check (not (select private.previewing()));
create policy no_delete_while_previewing on public.rsvp_contacts as restrictive for delete to authenticated
  using (not (select private.previewing()));

-- One RSVP and its contact, together or not at all. Security invoker: the guest's own rights decide, so it works
-- only for a published night. A second RSVP with the same contact fails on the unique index (23505).
create function public.reserve_place(
  p_night_id uuid,
  p_guest_name text,
  p_party_size smallint,
  p_contact text,
  p_checkin_code text
) returns void
language plpgsql security invoker set search_path = '' as $$
declare
  v_venue_id uuid;
  v_rsvp_id uuid := gen_random_uuid();
begin
  select n.venue_id into v_venue_id from public.event_nights n where n.id = p_night_id and n.status = 'published';
  if v_venue_id is null then
    raise exception 'night not open for RSVPs' using errcode = '42501';
  end if;
  insert into public.rsvps (id, event_night_id, venue_id, guest_name, party_size, checkin_code)
    values (v_rsvp_id, p_night_id, v_venue_id, p_guest_name, p_party_size, p_checkin_code);
  if p_contact is not null then
    insert into public.rsvp_contacts (rsvp_id, event_night_id, venue_id, contact)
      values (v_rsvp_id, p_night_id, v_venue_id, p_contact);
  end if;
end $$;

revoke execute on function public.reserve_place(uuid, text, smallint, text, text) from public;
grant execute on function public.reserve_place(uuid, text, smallint, text, text) to anon, authenticated;

-- A guest checks themselves in only from an hour before the start to six hours after it.
drop policy checkins_insert on public.checkins;
create policy checkins_insert on public.checkins for insert to anon, authenticated
  with check (
    venue_id in (select private.managed_venue_ids())
    or (spend_cents is null and venue_id in (select private.member_venue_ids()))
    or (
      rsvp_id is null
      and spend_cents is null
      and exists (
        select 1 from public.event_nights n
        where n.id = checkins.event_night_id
          and n.venue_id = checkins.venue_id
          and n.status = 'published'
          and now() between n.starts_at - interval '1 hour' and n.starts_at + interval '6 hours'
      )
    )
  );

-- What the night took, as the owner tells it. One figure per night, owners and managers only.
create table public.night_spend (
  event_night_id uuid primary key,
  venue_id uuid not null,
  spend_cents integer not null check (spend_cents between 0 and 2000000000),
  noted_by uuid references public.profiles (id) on delete set null default auth.uid(),
  updated_at timestamptz not null default now(),
  foreign key (event_night_id, venue_id) references public.event_nights (id, venue_id) on delete cascade
);
create index night_spend_venue_id_idx on public.night_spend (venue_id);
create index night_spend_night_venue_idx on public.night_spend (event_night_id, venue_id);
create index night_spend_noted_by_idx on public.night_spend (noted_by);

alter table public.night_spend enable row level security;
revoke all on public.night_spend from anon, authenticated;
grant all on public.night_spend to service_role;
grant select, delete on public.night_spend to authenticated;
grant insert (event_night_id, venue_id, spend_cents) on public.night_spend to authenticated;
grant update (spend_cents, updated_at) on public.night_spend to authenticated;

create policy night_spend_select_managed on public.night_spend for select to authenticated
  using (venue_id in (select private.managed_venue_ids()));
create policy night_spend_insert_managed on public.night_spend for insert to authenticated
  with check (venue_id in (select private.managed_venue_ids()));
create policy night_spend_update_managed on public.night_spend for update to authenticated
  using (venue_id in (select private.managed_venue_ids()))
  with check (venue_id in (select private.managed_venue_ids()));
create policy night_spend_delete_managed on public.night_spend for delete to authenticated
  using (venue_id in (select private.managed_venue_ids()));

create policy no_insert_while_previewing on public.night_spend as restrictive for insert to authenticated
  with check (not (select private.previewing()));
create policy no_update_while_previewing on public.night_spend as restrictive for update to authenticated
  using (not (select private.previewing())) with check (not (select private.previewing()));
create policy no_delete_while_previewing on public.night_spend as restrictive for delete to authenticated
  using (not (select private.previewing()));

create trigger night_spend_audit after insert or update or delete on public.night_spend
  for each row execute function private.audit_change();
