import "server-only"
import { unwrap } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"

const DEMO_COLUMNS = "id, name, address, venue_type, agent_runs(status)"

export const venuesRepository = {
  async listDemo(supabase: ServerSupabase) {
    return unwrap(
      await supabase
        .from("venues")
        .select(DEMO_COLUMNS)
        .eq("is_demo", true)
        .eq("agent_runs.status", "succeeded")
        .order("name")
        .limit(12),
    )
  },
}
