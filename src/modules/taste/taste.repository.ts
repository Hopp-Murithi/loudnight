import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { Json } from "@/types/database"

const UNIQUE_VIOLATION = "23505"

export interface CachedAnswer {
  id: string
  response: Json
  expiresAt: string
}

export interface NewAnswer {
  requestHash: string
  endpoint: string
  request: Json
  response: Json
  ttlDays: number
}

// The shared Qloo cache. Service role only: answers describe places, not venues, and receipts outlive freshness.
export const tasteRepository = {
  async findCurrent(admin: AdminSupabase, requestHash: string): Promise<CachedAnswer | null> {
    const { data, error } = await admin
      .from("qloo_cache")
      .select("id, response, expires_at")
      .eq("request_hash", requestHash)
      .is("superseded_at", null)
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data ? { id: data.id, response: data.response, expiresAt: data.expires_at } : null
  },

  // Null means a concurrent store of the same request won; the caller reads the winner's row.
  async store(admin: AdminSupabase, answer: NewAnswer): Promise<string | null> {
    const { data, error } = await admin.rpc("store_qloo_answer", {
      p_request_hash: answer.requestHash,
      p_endpoint: answer.endpoint,
      p_request: answer.request,
      p_response: answer.response,
      p_ttl_days: answer.ttlDays,
    })
    if (error?.code === UNIQUE_VIOLATION) return null
    if (error) throw fromDatabaseError(error)
    return data
  },
}
