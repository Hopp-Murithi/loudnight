-- Row level security regression test. Run with `npm run db:test` (local) or through MCP execute_sql (hosted).
-- It builds a small scenario, asserts every access rule, then rolls everything back by raising.
-- Success looks like: ERROR P0001: ALL RLS ASSERTIONS PASSED

do $$
#variable_conflict use_variable
declare
  u_owner uuid := gen_random_uuid(); u_manager uuid := gen_random_uuid(); u_door uuid := gen_random_uuid();
  u_other uuid := gen_random_uuid(); u_admin uuid := gen_random_uuid();
  v_mine uuid; v_other uuid; v_demo uuid := gen_random_uuid();
  run_id uuid; concept_id uuid; cache_id uuid; series_id uuid; night_draft uuid; night_live uuid; v_rsvp uuid; i int;
  n int; failed boolean; new_venue uuid; before_count int; cache_old uuid; cache_new uuid; concept_two uuid; concept_out uuid; started_run uuid;
  demo_count int := (select count(*) from public.venues where is_demo);
begin
  insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, is_anonymous, created_at, updated_at) values
    (u_owner, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', null, '{}', '{}', true, now(), now()),
    (u_manager, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'm@t.test', '{}', '{}', false, now(), now()),
    (u_door, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'd@t.test', '{}', '{}', false, now(), now()),
    (u_other, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'o@t.test', '{}', '{"display_name":"Other"}', false, now(), now()),
    (u_admin, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'a@t.test', '{"role":"administrator"}', '{"role":"owner"}', false, now(), now());

  select count(*) into n from public.profiles where id in (u_owner, u_manager, u_door, u_other, u_admin);
  assert n = 5, 'every auth user gets a profile, got ' || n;
  assert (select is_anonymous from public.profiles where id = u_owner), 'anonymous visitors are marked';
  assert (select role from public.profiles where id = u_admin) = 'administrator', 'administrators come from app_metadata';
  assert (select role from public.profiles where id = u_other) = 'owner', 'everyone else is an owner';

  insert into public.venues (id, name, address, latitude, longitude, is_demo)
    values (v_demo, 'Demo', '1 Demo St', 40.7, -73.9, true);
  insert into public.venue_settings (venue_id, capacity, slow_night, break_even_headcount)
    values (v_demo, 50, 'tuesday', 20);

  -- owner creates a venue under their session and becomes its owner in the same statement
  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.venues (created_by, name, address, latitude, longitude)
    values (u_owner, 'Mine', '1 Main St', 40.71, -73.95) returning id into v_mine;
  insert into public.venue_settings (venue_id, capacity, slow_night, break_even_headcount)
    values (v_mine, 90, 'tuesday', 40);
  assert (select role from public.venue_members where venue_id = v_mine and user_id = u_owner) = 'owner', 'the creator owns the venue';
  insert into public.venue_members (venue_id, user_id, role, added_by) values
    (v_mine, u_manager, 'manager', u_owner), (v_mine, u_door, 'door', u_owner);

  failed := false;
  begin insert into public.venue_members (venue_id, user_id, role, added_by) values (v_mine, u_other, 'owner', u_owner); exception when others then failed := true; end;
  assert failed, 'a second owner cannot be added';
  failed := false;
  begin insert into public.venues (created_by, name, address, latitude, longitude) values (u_other, 'Fake', 'x', 1, 1); exception when others then failed := true; end;
  assert failed, 'nobody creates a venue for someone else';
  failed := false;
  begin update public.profiles set role = 'administrator' where id = u_owner; exception when insufficient_privilege then failed := true; end;
  assert failed, 'nobody promotes themselves';
  reset role;

  -- another owner's venue
  perform set_config('request.jwt.claims', json_build_object('sub', u_other, 'role', 'authenticated')::text, true);
  set local role authenticated;
  insert into public.venues (created_by, name, address, latitude, longitude)
    values (u_other, 'Theirs', '2 Main St', 40.72, -73.96) returning id into v_other;
  select count(*) into n from public.venues where id = v_mine; assert n = 0, 'other owners cannot see my venue';
  select count(*) into n from public.venue_settings where venue_id = v_mine; assert n = 0, 'nor its settings';
  select count(*) into n from public.venues where is_demo; assert n = demo_count + 1, 'everyone sees demo venues';
  update public.venues set name = 'hacked' where id = v_mine; get diagnostics n = row_count;
  assert n = 0, 'other owners cannot edit my venue';
  failed := false;
  begin insert into public.venue_members (venue_id, user_id, role, added_by) values (v_mine, u_other, 'manager', u_other); exception when others then failed := true; end;
  assert failed, 'nobody adds themselves to a team';
  reset role;

  -- server-written agent output with a receipt
  insert into public.qloo_cache (request_hash, endpoint, request, response, expires_at)
    values (repeat('a', 64), '/v2/insights', '{}', '{"results":{"entities":[{"name":"Afrobeats","affinity":0.94}]}}', now() + interval '7 days')
    returning id into cache_id;
  insert into public.agent_runs (venue_id, requested_by, target_weekday) values (v_mine, u_owner, 'tuesday') returning id into run_id;
  insert into public.concepts (run_id, venue_id, rank, is_shortlisted, name, pitch, reason_beats_nearby, audience_fit, novelty, venue_fit, cost_fit)
    values (run_id, v_mine, 1, true, 'Afrobeats Tuesday', 'Live afrobeats', 'Nobody nearby runs it', 0.9, 0.8, 0.7, 0.6)
    returning id into concept_id;
  insert into public.concepts (run_id, venue_id, rank, is_shortlisted, name, pitch, reason_beats_nearby, audience_fit, novelty, venue_fit, cost_fit)
    values (run_id, v_mine, 3, true, 'Second night', 'Another', 'Also fresh', 0.5, 0.5, 0.5, 0.5) returning id into concept_two;
  insert into public.concepts (run_id, venue_id, rank, name, pitch, reason_beats_nearby, audience_fit, novelty, venue_fit, cost_fit)
    values (run_id, v_mine, 4, 'Not shortlisted', 'x', 'x', 0.1, 0.1, 0.1, 0.1) returning id into concept_out;
  assert (select total_score from public.concepts where id = concept_id) = 78, 'score = 40x0.9 + 20x0.8 + 20x0.7 + 20x0.6 = 78';
  insert into public.evidence (concept_id, venue_id, qloo_cache_id, claim, value, response_path)
    values (concept_id, v_mine, cache_id, 'Afrobeats affinity', 0.94, '{results,entities,0,affinity}');
  failed := false;
  begin
    insert into public.evidence (concept_id, venue_id, qloo_cache_id, claim, value, response_path)
      values (concept_id, v_mine, cache_id, 'Made up', 3.4, '{results,entities,0,affinity}');
  exception when check_violation then failed := true; end;
  assert failed, 'a number without a receipt is refused';
  failed := false;
  begin
    insert into public.evidence (concept_id, venue_id, qloo_cache_id, claim, value, response_path)
      values (concept_id, v_mine, cache_id, 'Wrong path', 0.94, '{results,missing}');
  exception when check_violation then failed := true; end;
  assert failed, 'a path that leads nowhere is refused';
  failed := false;
  begin
    insert into public.concepts (run_id, venue_id, rank, name, pitch, reason_beats_nearby, audience_fit, novelty, venue_fit, cost_fit)
      values (run_id, v_other, 2, 'Cross', 'x', 'x', 0.1, 0.1, 0.1, 0.1);
  exception when foreign_key_violation then failed := true; end;
  assert failed, 'a concept cannot point at another venue''s run';

  -- the team plans a series: one draft night, one published night
  perform set_config('request.jwt.claims', json_build_object('sub', u_manager, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.concepts where venue_id = v_mine; assert n = 3, 'managers read agent output';
  select count(*) into n from public.qloo_cache where id = cache_id; assert n = 1, 'and the receipt behind it';
  failed := false;
  begin insert into public.evidence (concept_id, venue_id, qloo_cache_id, claim, value, response_path) values (concept_id, v_mine, cache_id, 'Forged', 0.94, '{results,entities,0,affinity}'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'sessions cannot write evidence';
  failed := false;
  begin insert into public.qloo_cache (request_hash, endpoint, request, response, expires_at) values (repeat('b', 64), '/x', '{}', '{}', now() + interval '1 day'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'sessions cannot write the Qloo cache';
  insert into public.series (venue_id, concept_id, weekday, starts_on) values (v_mine, concept_id, 'tuesday', current_date + 7)
    returning id into series_id;
  insert into public.event_nights (series_id, venue_id, sequence, starts_at, variation, public_slug, status) values
    (series_id, v_mine, 1, now() + interval '7 days', 'Opening night', 'afrobeats-tuesday-one', 'published'),
    (series_id, v_mine, 2, now() + interval '14 days', 'Week two', 'afrobeats-tuesday-two', 'draft');
  select id into night_live from public.event_nights where public_slug = 'afrobeats-tuesday-one';
  select id into night_draft from public.event_nights where public_slug = 'afrobeats-tuesday-two';
  select count(*) into n from public.venue_settings where venue_id = v_mine; assert n = 1, 'managers see the money';
  perform public.choose_concept(concept_id);
  assert (select chosen_at is not null from public.concepts where id = concept_id), 'managers choose a night';
  perform public.choose_concept(concept_two);
  select count(*) into n from public.concepts c where c.run_id = run_id and c.chosen_at is not null; assert n = 1, 'one choice per run';
  assert (select chosen_at is not null from public.concepts where id = concept_two), 'and a new choice replaces the old one';
  failed := false;
  begin perform public.choose_concept(concept_out); exception when sqlstate 'P0002' then failed := true; end;
  assert failed, 'only shortlisted nights can be chosen';
  failed := false;
  begin update public.concepts set name = 'renamed' where id = concept_id; exception when insufficient_privilege then failed := true; end;
  assert failed, 'sessions change nothing on a concept but the choice';
  insert into public.agent_runs (venue_id, requested_by, mode, target_weekday) values (v_mine, u_manager, 'encore', 'tuesday')
    returning id into started_run;
  insert into public.agent_runs (venue_id, mode, target_weekday, pair_id) values (v_mine, 'generic', 'tuesday', started_run);
  select count(*) into n from public.agent_runs where id = started_run or pair_id = started_run; assert n = 2, 'managers start a run and its generic twin';
  failed := false;
  begin insert into public.agent_runs (venue_id, requested_by, target_weekday) values (v_mine, u_owner, 'tuesday'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'nobody starts a run in someone else''s name';
  failed := false;
  begin insert into public.agent_runs (venue_id, mode, target_weekday) values (v_mine, 'generic', 'tuesday'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'a generic run must point at an Encore run';
  failed := false;
  begin insert into public.agent_runs (venue_id, requested_by, target_weekday, status) values (v_mine, u_manager, 'tuesday', 'succeeded'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'a run starts queued';
  reset role;

  -- an anonymous guest on the public event page
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  set local role anon;
  select count(*) into n from public.event_nights where venue_id = v_mine; assert n = 1, 'guests see published nights only, got ' || n;
  select count(*) into n from public.venues where id = v_mine; assert n = 1, 'and the venue behind a published night';
  select count(*) into n from public.venue_settings where venue_id = v_mine; assert n = 0, 'but never its money';
  select count(*) into n from public.concepts where venue_id = v_mine; assert n = 0, 'nor its plan';
  select count(*) into n from public.concepts where venue_id = v_demo; assert n = 0, 'demo plans are readable (none seeded here)';
  select count(*) into n from public.venue_settings where venue_id = v_demo; assert n = 1, 'demo settings are open to judges';
  insert into public.rsvps (event_night_id, venue_id, guest_name, guest_contact, checkin_code)
    values (night_live, v_mine, 'Ada', 'ada@example.com', 'code-guest-1');
  failed := false;
  begin perform public.choose_concept(concept_id); exception when insufficient_privilege then failed := true; end;
  assert failed, 'guests cannot choose a night';
  failed := false;
  begin insert into public.agent_runs (venue_id, target_weekday) values (v_mine, 'tuesday'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'guests cannot start a run';
  failed := false;
  begin insert into public.rsvps (event_night_id, venue_id, guest_name) values (night_draft, v_mine, 'Early'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'guests cannot RSVP to a draft night';
  failed := false;
  begin insert into public.rsvps (event_night_id, venue_id, guest_name, guest_contact) values (night_live, v_mine, 'Ada again', 'ADA@example.com'); exception when unique_violation then failed := true; end;
  assert failed, 'one RSVP per contact per night';
  failed := false;
  begin perform 1 from public.rsvps; exception when insufficient_privilege then failed := true; end;
  assert failed, 'guests never read the guest list';
  insert into public.checkins (event_night_id, venue_id, party_size) values (night_live, v_mine, 2);
  failed := false;
  begin insert into public.checkins (event_night_id, venue_id, spend_cents) values (night_live, v_mine, 5000); exception when insufficient_privilege then failed := true; end;
  assert failed, 'guests cannot log spend';
  reset role;

  -- door staff: guest list and check-ins, no money, no planning
  perform set_config('request.jwt.claims', json_build_object('sub', u_door, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select id into v_rsvp from public.rsvps where checkin_code = 'code-guest-1';
  assert v_rsvp is not null, 'door staff read the guest list';
  insert into public.checkins (event_night_id, venue_id, rsvp_id) values (night_live, v_mine, v_rsvp);
  select count(*) into n from public.venue_settings where venue_id = v_mine; assert n = 0, 'door staff never see money';
  update public.checkins set spend_cents = 4000 where venue_id = v_mine; get diagnostics n = row_count;
  assert n = 0, 'door staff cannot log spend';
  update public.event_nights set status = 'cancelled' where id = night_live; get diagnostics n = row_count;
  assert n = 0, 'door staff cannot change the plan';
  failed := false;
  begin perform public.choose_concept(concept_id); exception when insufficient_privilege then failed := true; end;
  assert failed, 'door staff cannot choose a night';
  failed := false;
  begin insert into public.agent_runs (venue_id, requested_by, target_weekday) values (v_mine, u_door, 'tuesday'); exception when insufficient_privilege then failed := true; end;
  assert failed, 'door staff cannot start a run';
  reset role;

  -- an administrator previews the owner: sees what they see, changes nothing
  perform set_config('request.jwt.claims', json_build_object('sub', u_admin, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.venues where id in (v_mine, v_other); assert n = 2, 'administrators see every venue';
  perform set_config('request.headers', json_build_object('x-encore-preview', u_owner)::text, true);
  assert (select private.previewing()), 'the preview is active';
  select count(*) into n from public.venue_settings where venue_id = v_mine; assert n = 1, 'a preview sees what the owner sees';
  select count(*) into n from public.venues where id = v_other; assert n = 0, 'and nothing the owner cannot';
  update public.venues set name = 'changed in preview' where id = v_mine; get diagnostics n = row_count;
  assert n = 0, 'nothing changes during a preview';
  failed := false;
  begin insert into public.checkins (event_night_id, venue_id) values (night_live, v_mine); exception when insufficient_privilege then failed := true; end;
  assert failed, 'no inserts during a preview';
  perform set_config('request.headers', json_build_object('x-encore-preview', u_admin)::text, true);
  assert not (select private.previewing()), 'an administrator cannot be previewed';
  perform set_config('request.headers', '{}', true);
  reset role;

  -- a non-administrator sending the preview header gains nothing
  perform set_config('request.jwt.claims', json_build_object('sub', u_other, 'role', 'authenticated')::text, true);
  perform set_config('request.headers', json_build_object('x-encore-preview', u_owner)::text, true);
  set local role authenticated;
  assert not (select private.previewing()), 'only administrators can preview';
  select count(*) into n from public.venue_settings where venue_id = v_mine; assert n = 0, 'the header widens nothing';
  perform set_config('request.headers', '{}', true);
  reset role;

  -- the owner's view and the audit trail
  perform set_config('request.jwt.claims', json_build_object('sub', u_owner, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into n from public.checkins where venue_id = v_mine; assert n = 2, 'the owner sees both arrivals, got ' || n;
  update public.checkins set spend_cents = 4000 where rsvp_id = v_rsvp; get diagnostics n = row_count;
  assert n = 1, 'the owner logs spend';
  select count(*) into n from public.audit_log where venue_id = v_mine and action = 'venues.insert'; assert n = 1, 'venue creation is audited';
  select count(*) into n from public.audit_log where venue_id = v_other; assert n = 0, 'no one reads another venue''s history';
  failed := false;
  begin delete from public.venue_members where venue_id = v_mine and user_id = u_owner; get diagnostics n = row_count; failed := n = 0; end;
  assert failed, 'the owner row cannot be removed';
  reset role;

  -- accounts: the sign-in email follows auth.users
  assert (select email from public.profiles where id = u_manager) = 'm@t.test', 'profiles carry the sign-in email';
  update auth.users set email = 'm2@t.test' where id = u_manager;
  assert (select email from public.profiles where id = u_manager) = 'm2@t.test', 'an email change reaches the profile';

  -- create_venue: venue, settings and owner row in one transaction, under the caller's own rights
  perform set_config('request.jwt.claims', json_build_object('sub', u_other, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select public.create_venue('Made in one go', '3 Main St', null, 40.73, -73.97, 'bar', 'America/New_York',
    80, '{stage}', 'wednesday', 30, 20000, 1800) into new_venue;
  assert (select role from public.venue_members where venue_id = new_venue and user_id = u_other) = 'owner', 'create_venue makes the caller the owner';
  assert (select break_even_headcount from public.venue_settings where venue_id = new_venue) = 30, 'and saves the settings with it';
  select count(*) into before_count from public.venues where created_by = u_other;
  failed := false;
  begin
    perform public.create_venue('Broken', '4 Main St', null, 40.73, -73.97, 'bar', 'America/New_York',
      80, '{}', 'wednesday', 0, 20000, 1800);
  exception when check_violation then failed := true; end;
  assert failed, 'invalid settings are refused';
  select count(*) into n from public.venues where created_by = u_other;
  assert n = before_count, 'and no venue is left behind without its settings';
  failed := false;
  begin perform public.consume_rate_limit('x', 1, 60); exception when insufficient_privilege then failed := true; end;
  assert failed, 'sessions cannot touch the rate limiter';
  failed := false;
  begin perform public.store_qloo_answer(repeat('d', 64), '/x', '{}', '{}', 7); exception when insufficient_privilege then failed := true; end;
  assert failed, 'sessions cannot store Qloo answers';
  reset role;

  -- the rate limiter itself, as the server calls it
  assert private.consume_rate_limit('test:bucket', 2, 60), 'first hit allowed';
  assert private.consume_rate_limit('test:bucket', 2, 60), 'second hit allowed';
  assert not private.consume_rate_limit('test:bucket', 2, 60), 'third hit refused';
  assert private.consume_rate_limit('test:other', 2, 60), 'buckets are separate';

  -- a refreshed Qloo answer keeps the old row, so existing receipts still resolve
  cache_old := public.store_qloo_answer(repeat('c', 64), '/v2/insights', '{}', '{"results":{"tags":[{"query":{"affinity":0.9}}]}}', 7);
  cache_new := public.store_qloo_answer(repeat('c', 64), '/v2/insights', '{}', '{"results":{"tags":[{"query":{"affinity":0.5}}]}}', 7);
  assert cache_old <> cache_new, 'a refresh is a new row';
  select count(*) into n from public.qloo_cache where request_hash = repeat('c', 64) and superseded_at is null;
  assert n = 1, 'only one answer per request is current';
  assert (select superseded_at is not null from public.qloo_cache where id = cache_old), 'the old answer is kept as history';
  assert (select response #>> '{results,tags,0,query,affinity}' from public.qloo_cache where id = cache_old) = '0.9',
    'and still holds the value its receipts quoted';
  failed := false;
  begin
    insert into public.qloo_cache (request_hash, endpoint, request, response, expires_at)
      values (repeat('c', 64), '/v2/insights', '{}', '{}', now() + interval '1 day');
  exception when unique_violation then failed := true; end;
  assert failed, 'two current answers for one request are refused';

  -- fresh runs are capped per person
  failed := false;
  begin
    for i in 1..6 loop
      insert into public.agent_runs (venue_id, requested_by, target_weekday) values (v_mine, u_owner, 'tuesday');
    end loop;
  exception when sqlstate 'EA429' then failed := true; end;
  assert failed, 'a seventh run within the hour is refused';

  raise exception 'ALL RLS ASSERTIONS PASSED';
end $$;
