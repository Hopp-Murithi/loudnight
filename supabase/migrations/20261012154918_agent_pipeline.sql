-- The planning agent: runs, the live trace, the Qloo cache, concepts, evidence with receipts, talent.
-- Every row here is written by the server only, so a receipt can never be forged from a browser.

create type public.run_mode as enum ('encore', 'generic');

create type public.run_status as enum ('queued', 'running', 'succeeded', 'failed');

create type public.pipeline_step as enum ('scout', 'read_neighbourhood', 'find_gap', 'generate_concepts', 'score', 'plan');

create type public.step_status as enum ('running', 'succeeded', 'failed');

create type public.popularity_tier as enum ('emerging', 'local', 'regional', 'national');

-- One planning run per venue and night. The generic mode is the plain-LLM answer shown beside Encore's.
create table public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  requested_by uuid references public.profiles (id) on delete set null,
  mode public.run_mode not null default 'encore',
  target_weekday public.weekday not null,
  status public.run_status not null default 'queued',
  current_step public.pipeline_step,
  generic_answer text check (generic_answer is null or length(generic_answer) <= 8000),
  error_message text check (error_message is null or length(error_message) <= 500),
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  constraint agent_runs_id_venue_key unique (id, venue_id),
  constraint agent_runs_finished_when_done check ((status in ('succeeded', 'failed')) = (finished_at is not null)),
  constraint agent_runs_generic_answer_mode check (generic_answer is null or mode = 'generic')
);
create index agent_runs_venue_created_idx on public.agent_runs (venue_id, created_at desc);
create index agent_runs_requested_by_created_idx on public.agent_runs (requested_by, created_at desc);

-- Each tool call inside a step, for the live trace and the "Powered by Qloo" panel.
create table public.run_steps (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  venue_id uuid not null,
  step public.pipeline_step not null,
  status public.step_status not null default 'running',
  tool text not null check (length(tool) between 1 and 80),
  input jsonb not null default '{}'::jsonb,
  output_summary jsonb not null default '{}'::jsonb,
  qloo_cache_id uuid,
  latency_ms integer check (latency_ms is null or latency_ms >= 0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  foreign key (run_id, venue_id) references public.agent_runs (id, venue_id) on delete cascade
);
create index run_steps_run_started_idx on public.run_steps (run_id, started_at);
create index run_steps_venue_id_idx on public.run_steps (venue_id);

-- Shared across tenants: Qloo answers about a place, not about a venue. Reused for seven days.
create table public.qloo_cache (
  id uuid primary key default gen_random_uuid(),
  request_hash text not null unique check (request_hash ~ '^[0-9a-f]{64}$'),
  endpoint text not null check (length(endpoint) between 1 and 200),
  request jsonb not null,
  response jsonb not null,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  constraint qloo_cache_expiry_after_fetch check (expires_at > fetched_at)
);

alter table public.run_steps
  add constraint run_steps_qloo_cache_id_fkey foreign key (qloo_cache_id) references public.qloo_cache (id) on delete set null;
create index run_steps_qloo_cache_id_idx on public.run_steps (qloo_cache_id);

-- Score = 40 x audience fit + 20 x novelty + 20 x venue fit + 20 x cost fit, each part between 0 and 1.
create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null,
  venue_id uuid not null,
  rank smallint not null check (rank between 1 and 6),
  is_shortlisted boolean not null default false,
  name text not null check (length(trim(name)) between 1 and 120),
  pitch text not null check (length(trim(pitch)) between 1 and 400),
  reason_beats_nearby text not null check (length(trim(reason_beats_nearby)) between 1 and 600),
  audience_fit numeric(4, 3) not null check (audience_fit between 0 and 1),
  novelty numeric(4, 3) not null check (novelty between 0 and 1),
  venue_fit numeric(4, 3) not null check (venue_fit between 0 and 1),
  cost_fit numeric(4, 3) not null check (cost_fit between 0 and 1),
  total_score smallint generated always as (
    round(40 * audience_fit + 20 * novelty + 20 * venue_fit + 20 * cost_fit)::smallint
  ) stored,
  estimated_cost_cents integer not null default 0 check (estimated_cost_cents >= 0),
  created_at timestamptz not null default now(),
  constraint concepts_id_venue_key unique (id, venue_id),
  constraint concepts_run_rank_key unique (run_id, rank),
  foreign key (run_id, venue_id) references public.agent_runs (id, venue_id) on delete cascade
);
create index concepts_venue_id_idx on public.concepts (venue_id);

-- The grounding rule: every number shown to an owner points at the stored Qloo response that holds it.
create table public.evidence (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null,
  venue_id uuid not null,
  qloo_cache_id uuid not null references public.qloo_cache (id) on delete restrict,
  claim text not null check (length(trim(claim)) between 1 and 200),
  value numeric not null,
  response_path text[] not null check (cardinality(response_path) between 1 and 12),
  created_at timestamptz not null default now(),
  foreign key (concept_id, venue_id) references public.concepts (id, venue_id) on delete cascade
);
create index evidence_concept_id_idx on public.evidence (concept_id);
create index evidence_venue_id_idx on public.evidence (venue_id);
create index evidence_qloo_cache_id_idx on public.evidence (qloo_cache_id);

-- Refuses a claim whose value is not at its path in the cached response. The validator in code drops it first.
create function private.enforce_evidence_receipt() returns trigger
language plpgsql set search_path = '' as $$
declare
  v_found text;
  v_number numeric;
begin
  select c.response #>> new.response_path into v_found from public.qloo_cache c where c.id = new.qloo_cache_id;
  begin
    v_number := v_found::numeric;
  exception when invalid_text_representation then
    v_number := null;
  end;
  if v_number is null or v_number <> new.value then
    raise exception 'evidence value has no receipt in its Qloo response' using errcode = '23514';
  end if;
  return new;
end $$;

create trigger evidence_requires_receipt before insert or update on public.evidence
  for each row execute function private.enforce_evidence_receipt();

create table public.talent_candidates (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null,
  venue_id uuid not null,
  qloo_entity_id text not null check (length(qloo_entity_id) between 1 and 200),
  qloo_cache_id uuid references public.qloo_cache (id) on delete set null,
  name text not null check (length(trim(name)) between 1 and 200),
  popularity_tier public.popularity_tier not null,
  overlap_score numeric(4, 3) not null check (overlap_score between 0 and 1),
  outreach_draft text check (outreach_draft is null or length(outreach_draft) <= 4000),
  created_at timestamptz not null default now(),
  constraint talent_candidates_concept_entity_key unique (concept_id, qloo_entity_id),
  foreign key (concept_id, venue_id) references public.concepts (id, venue_id) on delete cascade
);
create index talent_candidates_venue_id_idx on public.talent_candidates (venue_id);
create index talent_candidates_qloo_cache_id_idx on public.talent_candidates (qloo_cache_id);

-- A fresh run costs real API calls, so each person gets a few per hour. Demo venues are precomputed.
create function private.limit_fresh_runs() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_recent integer;
begin
  if new.requested_by is null then
    return new;
  end if;
  select count(*) into v_recent from public.agent_runs r
  where r.requested_by = new.requested_by and r.created_at > now() - interval '1 hour';
  if v_recent >= 6 then
    raise exception 'too many planning runs' using errcode = 'EA429';
  end if;
  return new;
end $$;

create trigger agent_runs_rate_limit before insert on public.agent_runs
  for each row execute function private.limit_fresh_runs();

revoke execute on function private.enforce_evidence_receipt(), private.limit_fresh_runs() from public;
