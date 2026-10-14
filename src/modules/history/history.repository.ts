import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

export const historyRepository = {
  // RLS: owners and managers read their venue's history; door staff get nothing. Administrators may read it all.
  async list(supabase: ServerSupabase, venueId: string | null, limit: number, offset = 0) {
    const query = supabase.from("audit_log").select("id, actor_id, venue_id, action, metadata, created_at")
    const { data, error } = await (venueId ? query.eq("venue_id", venueId) : query)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    if (error) throw fromDatabaseError(error)
    return data ?? []
  },

  async names(supabase: ServerSupabase, ids: string[]) {
    if (ids.length === 0) return []
    const { data, error } = await supabase.from("profiles").select("id, display_name, email").in("id", ids)
    if (error) throw fromDatabaseError(error)
    return data ?? []
  },

  async venueNames(supabase: ServerSupabase, ids: string[]) {
    if (ids.length === 0) return []
    const { data, error } = await supabase.from("venues").select("id, name").in("id", ids)
    if (error) throw fromDatabaseError(error)
    return data ?? []
  },

  // For actions taken with the service role, which no audit trigger sees: written by the service that acts.
  async record(
    admin: AdminSupabase,
    row: { actorId: string; action: string; subjectType: string; subjectId: string; metadata?: Json },
  ): Promise<void> {
    const { error } = await admin.from("audit_log").insert({
      actor_id: row.actorId,
      action: row.action,
      subject_type: row.subjectType,
      subject_id: row.subjectId,
      metadata: row.metadata ?? {},
    })
    if (error) throw fromDatabaseError(error)
  },
}
