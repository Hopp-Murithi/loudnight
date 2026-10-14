import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

export type TalentInsert = Database["public"]["Tables"]["talent_candidates"]["Insert"]

const VIEW_COLUMNS =
  "id, name, popularity_tier, overlap_score, fit_signals, outreach_draft, outreach_edited, qloo_cache_id, booked_at, profile, source"

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
      .select("id, name, overlap_score, response_path, qloo_cache_id, fit_signals, source")
      .eq("id", talentId)
      .maybeSingle()
    check(error)
    return data
  },

  // The night's current list: which acts the owner has booked or reworded, and which page it came from.
  async currentList(admin: AdminSupabase, conceptId: string) {
    const { data, error } = await admin
      .from("talent_candidates")
      .select("qloo_entity_id, outreach_edited, booked_at, search_page")
      .eq("concept_id", conceptId)
      .limit(40)
    check(error)
    return data ?? []
  },

  // Looking again replaces the list, except acts the owner booked or reworded: those stay whatever comes back.
  async refreshForConcept(admin: AdminSupabase, conceptId: string, rows: TalentInsert[]): Promise<void> {
    const removed = await admin
      .from("talent_candidates")
      .delete()
      .eq("concept_id", conceptId)
      .is("booked_at", null)
      .is("outreach_edited", null)
    check(removed.error)
    if (rows.length === 0) return
    const { error } = await admin.from("talent_candidates").insert(rows)
    check(error)
  },

  // With the caller's own client: the column grants and the policy let owners and managers change only these two.
  async updateOwn(
    supabase: ServerSupabase,
    talentId: string,
    changes: { outreach_edited: string } | { booked_at: string | null },
  ): Promise<boolean> {
    const { data, error } = await supabase.from("talent_candidates").update(changes).eq("id", talentId).select("id")
    check(error)
    return (data ?? []).length > 0
  },
}
