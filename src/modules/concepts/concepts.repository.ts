import "server-only"
import { fromDatabaseError, notFound } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type ConceptInsert = Database["public"]["Tables"]["concepts"]["Insert"]
type EvidenceInsert = Database["public"]["Tables"]["evidence"]["Insert"]

const CARD_COLUMNS =
  "id, rank, name, pitch, reason_beats_nearby, format, audience_fit, novelty, venue_fit, cost_fit, total_score, " +
  "estimated_cost_cents, chosen_at, evidence(id, claim, value)"

export const conceptsRepository = {
  // Agent output: written by the service role, read by sessions through RLS.
  async insertConcepts(admin: AdminSupabase, rows: ConceptInsert[]): Promise<{ id: string; rank: number }[]> {
    const { data, error } = await admin.from("concepts").insert(rows).select("id, rank")
    if (error) throw fromDatabaseError(error)
    return data
  },

  async insertEvidence(admin: AdminSupabase, rows: EvidenceInsert[]): Promise<void> {
    if (rows.length === 0) return
    const { error } = await admin.from("evidence").insert(rows)
    if (error) throw fromDatabaseError(error)
  },

  async listShortlisted(supabase: ServerSupabase, runId: string) {
    const { data, error } = await supabase
      .from("concepts")
      .select(CARD_COLUMNS)
      .eq("run_id", runId)
      .eq("is_shortlisted", true)
      .order("rank")
      .limit(3)
    if (error) throw fromDatabaseError(error)
    return data as unknown as ConceptRow[]
  },

  // RLS decides whether the caller may see this claim at all. Hidden evidence is simply not found.
  async findEvidence(supabase: ServerSupabase, evidenceId: string) {
    const { data, error } = await supabase
      .from("evidence")
      .select("id, claim, value, response_path, qloo_cache_id")
      .eq("id", evidenceId)
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    if (!data) throw notFound("That receipt is not available.")
    return data
  },

  // Read only after the caller's own client found the evidence, so the cache is never a way around RLS.
  async cacheForReceipt(admin: AdminSupabase, cacheId: string) {
    const { data, error } = await admin
      .from("qloo_cache")
      .select("endpoint, request, response, fetched_at")
      .eq("id", cacheId)
      .single()
    if (error) throw fromDatabaseError(error)
    return data
  },

  async choose(supabase: ServerSupabase, conceptId: string): Promise<void> {
    const { error } = await supabase.rpc("choose_concept", { p_concept_id: conceptId })
    if (error) throw fromDatabaseError(error)
  },
}

export interface ConceptRow {
  id: string
  rank: number
  name: string
  pitch: string
  reason_beats_nearby: string
  format: Database["public"]["Enums"]["concept_format"]
  audience_fit: number
  novelty: number
  venue_fit: number
  cost_fit: number
  total_score: number
  estimated_cost_cents: number
  chosen_at: string | null
  evidence: { id: string; claim: string; value: number }[]
}
