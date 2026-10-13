import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

export type TalentInsert = Database["public"]["Tables"]["talent_candidates"]["Insert"]

const VIEW_COLUMNS =
  "id, name, popularity_tier, overlap_score, fit_signals, outreach_draft, outreach_edited, qloo_cache_id"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

export const talentRepository = {
  async listForConcept(supabase: ServerSupabase | AdminSupabase, conceptId: string) {
    const { data, error } = await supabase
      .from("talent_candidates")
      .select(VIEW_COLUMNS)
      .eq("concept_id", conceptId)
      .order("overlap_score", { ascending: false })
      .limit(20)
    check(error)
    return data ?? []
  },

  // RLS decides whether the caller may see this act at all. A hidden one is simply not found.
  async findForReceipt(supabase: ServerSupabase, talentId: string) {
    const { data, error } = await supabase
      .from("talent_candidates")
      .select("id, name, overlap_score, response_path, qloo_cache_id, fit_signals")
      .eq("id", talentId)
      .maybeSingle()
    check(error)
    return data
  },

  // A refresh replaces the whole list for the night, the owner's edits included.
  async replaceForConcept(admin: AdminSupabase, conceptId: string, rows: TalentInsert[]): Promise<void> {
    const removed = await admin.from("talent_candidates").delete().eq("concept_id", conceptId)
    check(removed.error)
    if (rows.length === 0) return
    const { error } = await admin.from("talent_candidates").insert(rows)
    check(error)
  },

  // With the caller's own client: the column grant and the policy let owners and managers change only this.
  async editOutreach(supabase: ServerSupabase, talentId: string, message: string): Promise<boolean> {
    const { data, error } = await supabase
      .from("talent_candidates")
      .update({ outreach_edited: message })
      .eq("id", talentId)
      .select("id")
    check(error)
    return (data ?? []).length > 0
  },
}
