import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

export const promoteRepository = {
  async nightAssets(supabase: ServerSupabase, seriesId: string) {
    const { data, error } = await supabase.from("event_nights").select("id, assets").eq("series_id", seriesId).limit(4)
    check(error)
    return data ?? []
  },

  async findNight(supabase: ServerSupabase, nightId: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select("id, venue_id, assets")
      .eq("id", nightId)
      .maybeSingle()
    check(error)
    return data
  },

  // With the caller's own client, so the night policies decide. Zero rows means it was not theirs to change.
  async saveAssets(supabase: ServerSupabase, nightId: string, assets: Json): Promise<boolean> {
    const { data, error } = await supabase.from("event_nights").update({ assets }).eq("id", nightId).select("id")
    check(error)
    return (data ?? []).length > 0
  },
}
