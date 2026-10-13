-- Refreshing a Qloo answer keeps the old row, so every receipt still points at the exact value it quoted.
-- Only one row per request is current; superseded rows stay for the evidence and trace steps that cite them.

alter table public.qloo_cache add column superseded_at timestamptz;
alter table public.qloo_cache
  add constraint qloo_cache_superseded_after_fetch check (superseded_at is null or superseded_at >= fetched_at);

alter table public.qloo_cache drop constraint qloo_cache_request_hash_key;
create unique index qloo_cache_current_request_idx on public.qloo_cache (request_hash) where superseded_at is null;

-- One transaction: the current row becomes history; a concurrent store fails on the unique index and re-reads.
create function public.store_qloo_answer(
  p_request_hash text,
  p_endpoint text,
  p_request jsonb,
  p_response jsonb,
  p_ttl_days integer
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  v_id uuid;
begin
  update public.qloo_cache
    set superseded_at = now()
    where request_hash = p_request_hash and superseded_at is null;
  insert into public.qloo_cache (request_hash, endpoint, request, response, expires_at)
    values (p_request_hash, p_endpoint, p_request, p_response, now() + make_interval(days => p_ttl_days))
    returning id into v_id;
  return v_id;
end $$;

revoke execute on function public.store_qloo_answer(text, text, jsonb, jsonb, integer) from public, anon, authenticated;
grant execute on function public.store_qloo_answer(text, text, jsonb, jsonb, integer) to service_role;
