import "server-only"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "@/modules/auth/types"
import { conceptsRepository, type ConceptRow } from "./concepts.repository"
import type { ConceptView, ReceiptView } from "./concepts.schemas"

// Receipts show the object around the cited value (one tag or entity), never the whole cached answer.
const SLICE_DEPTH = 3

const toView = (row: ConceptRow): ConceptView => ({
  id: row.id,
  rank: row.rank,
  name: row.name,
  pitch: row.pitch,
  reasonBeatsNearby: row.reason_beats_nearby,
  format: row.format,
  scores: {
    audienceFit: Number(row.audience_fit),
    novelty: Number(row.novelty),
    venueFit: Number(row.venue_fit),
    costFit: Number(row.cost_fit),
    total: row.total_score,
  },
  estimatedCostCents: row.estimated_cost_cents,
  chosen: row.chosen_at !== null,
  evidence: row.evidence.map((item) => ({ id: item.id, claim: item.claim, value: Number(item.value) })),
})

export async function listShortlist(supabase: ServerSupabase, runId: string): Promise<ConceptView[]> {
  return (await conceptsRepository.listShortlisted(supabase, runId)).map(toView)
}

const at = (value: unknown, path: string[]): unknown =>
  path.reduce<unknown>((node, key) => (node as Record<string, unknown> | null | undefined)?.[key], value)

// One stored value's receipt. Call it only after the caller's own client found the row citing the cache (RLS first).
export async function receiptAt(
  cacheId: string,
  path: string[],
  claim: string,
  value: number | null,
): Promise<ReceiptView> {
  const cache = await conceptsRepository.cacheForReceipt(createAdminSupabase(), cacheId)
  const request = cache.request as { params?: Record<string, unknown> }
  return {
    claim,
    value,
    endpoint: cache.endpoint,
    params: request.params ?? {},
    fetchedAt: cache.fetched_at,
    slice: at(cache.response, path.slice(0, SLICE_DEPTH)) ?? null,
    highlight: path.slice(SLICE_DEPTH),
  }
}

export async function readReceipt(supabase: ServerSupabase, evidenceId: string): Promise<ReceiptView> {
  const evidence = await conceptsRepository.findEvidence(supabase, evidenceId)
  return receiptAt(evidence.qloo_cache_id, evidence.response_path, evidence.claim, Number(evidence.value))
}

export async function chooseConcept(ctx: RequestContext, conceptId: string): Promise<void> {
  await conceptsRepository.choose(ctx.supabase, conceptId)
}
