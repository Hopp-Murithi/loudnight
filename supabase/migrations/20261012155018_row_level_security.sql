-- Row level security: the database decides who sees what, whatever the application does.
-- Venue team: owners and managers plan and see money; door staff check guests in. Administrators see all.
-- Anyone reads demo venues and published event pages. Agent output and the Qloo cache are written by the
-- service role only. Nothing at all can be written while an administrator is previewing someone.

alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_members enable row level security;
alter table public.venue_settings enable row level security;
alter table public.audit_log enable row level security;
alter table public.agent_runs enable row level security;
alter table public.run_steps enable row level security;
alter table public.qloo_cache enable row level security;
alter table public.concepts enable row level security;
alter table public.evidence enable row level security;
alter table public.talent_candidates enable row level security;
alter table public.series enable row level security;
alter table public.event_nights enable row level security;
alter table public.rsvps enable row level security;
alter table public.checkins enable row level security;

revoke all on
  public.profiles, public.venues, public.venue_members, public.venue_settings, public.audit_log,
  public.agent_runs, public.run_steps, public.qloo_cache, public.concepts, public.evidence,
  public.talent_candidates, public.series, public.event_nights, public.rsvps, public.checkins
  from anon, authenticated;

grant all on
  public.profiles, public.venues, public.venue_members, public.venue_settings, public.audit_log,
  public.agent_runs, public.run_steps, public.qloo_cache, public.concepts, public.evidence,
  public.talent_candidates, public.series, public.event_nights, public.rsvps, public.checkins
  to service_role;
grant usage, select on sequence public.audit_log_id_seq to service_role;

-- profiles: yourself, your venue team, or everyone for an administrator. Role and status never change
-- from a session.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select private.viewer_id())
    or id = (select auth.uid())
    or (select private.is_administrator())
    or id in (select m.user_id from public.venue_members m where m.venue_id in (select private.member_venue_ids()))
  );

create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- venues: anyone reads the public face of a demo venue or of a venue with a published night.
grant select (id, name, address, latitude, longitude, venue_type, time_zone, is_demo) on public.venues to anon;
grant select, delete on public.venues to authenticated;
grant insert (created_by, name, address, google_place_id, latitude, longitude, venue_type, time_zone)
  on public.venues to authenticated;
grant update (name, address, google_place_id, latitude, longitude, venue_type, time_zone)
  on public.venues to authenticated;

-- created_by is checked directly too: INSERT ... RETURNING re-checks this policy before the owner row is visible.
create policy venues_select on public.venues for select to anon, authenticated
  using (
    id in (select private.readable_venue_ids())
    or created_by = (select private.viewer_id())
    or exists (select 1 from public.event_nights n where n.venue_id = venues.id and n.status = 'published')
  );

create policy venues_insert_own on public.venues for insert to authenticated
  with check (created_by = (select auth.uid()) and not is_demo);

create policy venues_update_managed on public.venues for update to authenticated
  using (id in (select private.managed_venue_ids()) and not is_demo)
  with check (id in (select private.managed_venue_ids()) and not is_demo);

create policy venues_delete_owner on public.venues for delete to authenticated
  using (id in (select private.owner_venue_ids()) and not is_demo);

-- venue_members: the team sees itself; only the owner adds, changes or removes people, never the owner row.
grant select on public.venue_members to authenticated;
grant insert (venue_id, user_id, role, added_by) on public.venue_members to authenticated;
grant update (role) on public.venue_members to authenticated;
grant delete on public.venue_members to authenticated;

create policy venue_members_select on public.venue_members for select to authenticated
  using (venue_id in (select private.member_venue_ids()));

create policy venue_members_insert_owner on public.venue_members for insert to authenticated
  with check (
    venue_id in (select private.owner_venue_ids()) and role <> 'owner' and added_by = (select auth.uid())
  );

create policy venue_members_update_owner on public.venue_members for update to authenticated
  using (venue_id in (select private.owner_venue_ids()) and role <> 'owner')
  with check (venue_id in (select private.owner_venue_ids()) and role <> 'owner');

create policy venue_members_delete_owner on public.venue_members for delete to authenticated
  using (venue_id in (select private.owner_venue_ids()) and role <> 'owner');

-- venue_settings: managers only; demo settings are readable so judges see the full plan.
grant select on public.venue_settings to anon;
grant select, insert, update on public.venue_settings to authenticated;

create policy venue_settings_select on public.venue_settings for select to anon, authenticated
  using (
    venue_id in (select private.managed_venue_ids())
    or venue_id in (select v.id from public.venues v where v.is_demo)
  );

create policy venue_settings_insert_managed on public.venue_settings for insert to authenticated
  with check (venue_id in (select private.managed_venue_ids()));

create policy venue_settings_update_managed on public.venue_settings for update to authenticated
  using (venue_id in (select private.managed_venue_ids()))
  with check (venue_id in (select private.managed_venue_ids()));

-- audit_log: managers read their venue's history. Written by trigger or the service role.
grant select on public.audit_log to authenticated;

create policy audit_log_select on public.audit_log for select to authenticated
  using (
    venue_id in (select private.managed_venue_ids())
    or (venue_id is null and (select private.is_administrator()))
  );

-- Agent output: readable with the venue, never writable from a session.
grant select on public.agent_runs, public.run_steps, public.concepts, public.evidence, public.talent_candidates
  to anon, authenticated;

create policy agent_runs_select on public.agent_runs for select to anon, authenticated
  using (venue_id in (select private.readable_venue_ids()));

create policy run_steps_select on public.run_steps for select to anon, authenticated
  using (venue_id in (select private.readable_venue_ids()));

create policy concepts_select on public.concepts for select to anon, authenticated
  using (venue_id in (select private.readable_venue_ids()));

create policy evidence_select on public.evidence for select to anon, authenticated
  using (venue_id in (select private.readable_venue_ids()));

create policy talent_candidates_select on public.talent_candidates for select to anon, authenticated
  using (venue_id in (select private.readable_venue_ids()));

-- qloo_cache: a response is readable when a readable receipt or trace step points at it.
grant select on public.qloo_cache to anon, authenticated;

create policy qloo_cache_select on public.qloo_cache for select to anon, authenticated
  using (
    exists (
      select 1 from public.evidence e
      where e.qloo_cache_id = qloo_cache.id and e.venue_id in (select private.readable_venue_ids())
    )
    or exists (
      select 1 from public.run_steps s
      where s.qloo_cache_id = qloo_cache.id and s.venue_id in (select private.readable_venue_ids())
    )
  );

-- series and event nights: managers plan and publish; published nights are public pages.
grant select on public.series, public.event_nights to anon;
grant select, insert, update, delete on public.series, public.event_nights to authenticated;

create policy series_select on public.series for select to anon, authenticated
  using (venue_id in (select private.readable_venue_ids()));

create policy series_insert_managed on public.series for insert to authenticated
  with check (venue_id in (select private.managed_venue_ids()));

create policy series_update_managed on public.series for update to authenticated
  using (venue_id in (select private.managed_venue_ids()))
  with check (venue_id in (select private.managed_venue_ids()));

create policy series_delete_managed on public.series for delete to authenticated
  using (venue_id in (select private.managed_venue_ids()));

create policy event_nights_select on public.event_nights for select to anon, authenticated
  using (status = 'published' or venue_id in (select private.readable_venue_ids()));

create policy event_nights_insert_managed on public.event_nights for insert to authenticated
  with check (venue_id in (select private.managed_venue_ids()));

create policy event_nights_update_managed on public.event_nights for update to authenticated
  using (venue_id in (select private.managed_venue_ids()))
  with check (venue_id in (select private.managed_venue_ids()));

create policy event_nights_delete_managed on public.event_nights for delete to authenticated
  using (venue_id in (select private.managed_venue_ids()));

-- rsvps: anyone may RSVP to a published night; the whole team reads the guest list for the door.
-- The server generates the check-in code, because a guest cannot read their row back.
grant insert (event_night_id, venue_id, guest_name, guest_contact, party_size, checkin_code)
  on public.rsvps to anon, authenticated;
grant select, delete on public.rsvps to authenticated;

create policy rsvps_insert_published on public.rsvps for insert to anon, authenticated
  with check (
    exists (
      select 1 from public.event_nights n
      where n.id = rsvps.event_night_id and n.venue_id = rsvps.venue_id and n.status = 'published'
    )
  );

create policy rsvps_select_team on public.rsvps for select to authenticated
  using (venue_id in (select private.member_venue_ids()));

create policy rsvps_delete_managed on public.rsvps for delete to authenticated
  using (venue_id in (select private.managed_venue_ids()));

-- checkins: a guest checks themselves in at a published night's door. The team links an arrival to an
-- RSVP by scanning its code; only managers log spend.
grant insert (event_night_id, venue_id, party_size) on public.checkins to anon;
grant insert (event_night_id, venue_id, rsvp_id, party_size, spend_cents) on public.checkins to authenticated;
grant select, delete on public.checkins to authenticated;
grant update (spend_cents) on public.checkins to authenticated;

create policy checkins_insert on public.checkins for insert to anon, authenticated
  with check (
    venue_id in (select private.managed_venue_ids())
    or (spend_cents is null and venue_id in (select private.member_venue_ids()))
    or (
      rsvp_id is null
      and spend_cents is null
      and exists (
        select 1 from public.event_nights n
        where n.id = checkins.event_night_id and n.venue_id = checkins.venue_id and n.status = 'published'
      )
    )
  );

create policy checkins_select_team on public.checkins for select to authenticated
  using (venue_id in (select private.member_venue_ids()));

create policy checkins_update_managed on public.checkins for update to authenticated
  using (venue_id in (select private.managed_venue_ids()))
  with check (venue_id in (select private.managed_venue_ids()));

create policy checkins_delete_managed on public.checkins for delete to authenticated
  using (venue_id in (select private.managed_venue_ids()));

-- A preview is read only, on every table a session can write. A later migration that adds a table adds
-- the same three restrictive policies for it.
do $$
declare
  target record;
  verb text;
begin
  for target in
    select c.relname as table_name
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where c.relkind = 'r' and c.relrowsecurity and n.nspname = 'public'
  loop
    foreach verb in array array['insert', 'update', 'delete'] loop
      execute format(
        'create policy %I on public.%I as restrictive for %s to authenticated %s',
        'no_' || verb || '_while_previewing', target.table_name, verb,
        case verb
          when 'insert' then 'with check (not (select private.previewing()))'
          when 'update' then 'using (not (select private.previewing())) with check (not (select private.previewing()))'
          else 'using (not (select private.previewing()))'
        end
      );
    end loop;
  end loop;
end $$;
