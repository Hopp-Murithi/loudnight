-- Runs carry what each step found, so the next step (its own server call) can build on it, and a generic run
-- points at the Encore run it is compared with. Owners and managers start runs with their own session.

alter table public.agent_runs
  add column context jsonb not null default '{}'::jsonb check (pg_column_size(context) <= 1048576),
  add column pair_id uuid;

alter table public.agent_runs
  add constraint agent_runs_pair_fkey foreign key (pair_id, venue_id)
    references public.agent_runs (id, venue_id) on delete cascade,
  add constraint agent_runs_pair_is_generic check (pair_id is null or mode = 'generic');

create index agent_runs_pair_venue_idx on public.agent_runs (pair_id, venue_id);

grant insert (venue_id, requested_by, mode, target_weekday, pair_id) on public.agent_runs to authenticated;

-- An Encore run counts against its requester's hourly cap; its generic twin has no requester, so pairs count once.
create policy agent_runs_start on public.agent_runs for insert to authenticated
  with check (
    venue_id in (select private.managed_venue_ids())
    and status = 'queued'
    and (
      (mode = 'encore' and requested_by = (select private.viewer_id()) and pair_id is null)
      or (mode = 'generic' and requested_by is null and pair_id is not null)
    )
  );
