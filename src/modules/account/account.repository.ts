import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"

export const accountRepository = {
  async updateDisplayName(supabase: ServerSupabase, userId: string, displayName: string): Promise<string | null> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", userId)
      .select("display_name")
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data?.display_name ?? null
  },
}
