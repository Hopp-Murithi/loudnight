import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"

export const historyRepository = {
  // RLS: owners and managers read their venue's history; door staff get nothing.
  async list(supabase: ServerSupabase, venueId: string, limit: number) {
    const { data, error } = await supabase
      .from("audit_log")
      .select("id, actor_id, action, metadata, created_at")
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false })
      .limit(limit)
    if (error) throw fromDatabaseError(error)
    return data ?? []
  },

  async names(supabase: ServerSupabase, ids: string[]) {
    if (ids.length === 0) return []
    const { data, error } = await supabase.from("profiles").select("id, display_name, email").in("id", ids)
    if (error) throw fromDatabaseError(error)
    return data ?? []
  },
}
