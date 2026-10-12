import "server-only"
import type { ServerSupabase } from "@/lib/supabase/server"

export const healthRepository = {
  async databaseAnswers(supabase: ServerSupabase): Promise<boolean> {
    const { error } = await supabase.from("venues").select("id").eq("is_demo", true).limit(1)
    return !error
  },
}
