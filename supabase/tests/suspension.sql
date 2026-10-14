-- Venue suspension: only administrators set or lift it, with a reason; while it lasts the team reads but writes
-- nothing, and guests can neither RSVP nor check in. Success looks like: ERROR P0001: SUSPENSION ASSERTIONS PASSED

do $$
declare
  u_owner uuid := gen_random_uuid(); u_manager uuid := gen_random_uuid(); u_admin uuid := gen_random_uuid();
  v uuid; c uuid; r uuid; s uuid; nt uuid; n int; failed boolean;
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, is_anonymous, created_at, updated_at) values
    (u_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'so@t.test', '{}', '{}', false, now(), now()),
    (u_manager, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sm@t.test', '{}', '{}', false, now(), now()),
    (u_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sa@t.test', '{"role":"administrator"}', '{}', false, now(), now());
  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.venues (created_by, name, address, latitude, longitude) values (u_owner, 'S', '1', 1, 1) returning id into v;
  insert into public.venue_settings (venue_id, capacity, slow_night, break_even_headcount) values (v, 50, 'tuesday', 20);
  insert into public.venue_members (venue_id, user_id, role, added_by) values (v, u_manager, 'manager', u_owner);
  failed := false;
  begin update public.venues set suspended_at = now(), suspended_reason = 'self' where id = v; exception when insufficient_privilege then failed := true; end;
  assert failed, 'an owner cannot suspend their own venue';
  reset role;
  insert into public.agent_runs (venue_id, target_weekday) values (v, 'tuesday') returning id into r;
  insert into public.concepts (run_id, venue_id, rank, is_shortlisted, name, pitch, reason_beats_nearby, audience_fit, novelty, venue_fit, cost_fit) values (r, v, 1, true, 'n', 'p', 'r', .5, .5, .5, .5) returning id into c;
  insert into public.series (venue_id, concept_id, weekday, starts_on) values (v, c, 'tuesday', current_date) returning id into s;
  insert into public.event_nights (series_id, venue_id, sequence, starts_at, variation, public_slug, status) values (s, v, 1, now() + interval '30 minutes', 'x', 'suspension-test-night', 'published') returning id into nt;

  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  failed := false;
  begin update public.venues set suspended_at = now() where id = v; exception when check_violation then failed := true; end;
  assert failed, 'a suspension needs a reason';
  update public.venues set suspended_at = now(), suspended_reason = 'Fake events reported' where id = v; get diagnostics n = row_count;
  assert n = 1, 'an administrator suspends a venue';
  assert (select suspended_by from public.venues where id = v) = u_admin, 'and is recorded as the one who did';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_manager, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.venue_settings where venue_id = v; assert n = 1, 'the team still reads a suspended venue';
  update public.venue_settings set capacity = 60 where venue_id = v; get diagnostics n = row_count;
  assert n = 0, 'but changes nothing in it';
  update public.venues set name = 'renamed' where id = v; get diagnostics n = row_count;
  assert n = 0, 'not even its name';
  failed := false;
  begin insert into public.agent_runs (venue_id, requested_by, target_weekday) values (v, u_manager, 'tuesday'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'and starts no plan';
  failed := false;
  begin update public.venues set suspended_at = null, suspended_reason = null where id = v; exception when insufficient_privilege then failed := true; end;
  assert failed or (select suspended_at is not null from public.venues where id = v), 'nor lifts the suspension';
  reset role;

  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  assert (select suspended_at is not null from public.venues where id = v), 'guests can see a venue is suspended';
  failed := false;
  begin perform public.reserve_place(nt, 'Guest', 1::smallint, null, 'code-suspended'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'guests cannot RSVP while it is suspended';
  failed := false;
  begin insert into public.checkins (event_night_id, venue_id, party_size) values (nt, v, 1); exception when insufficient_privilege then failed := true; end;
  assert failed, 'nor check themselves in';
  reset role;

  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.venues set suspended_at = null, suspended_reason = null where id = v;
  assert (select suspended_by is null from public.venues where id = v), 'lifting clears who suspended it';
  reset role;
  perform set_config('request.jwt.claims', json_build_object('sub', u_manager, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update public.venue_settings set capacity = 60 where venue_id = v; get diagnostics n = row_count;
  assert n = 1, 'once lifted, the team works again';
  reset role;
  select count(*) into n from public.audit_log where venue_id = v and action = 'venues.update'; assert n >= 2, 'suspending and lifting are audited';
  raise exception 'SUSPENSION ASSERTIONS PASSED';
end $$;
