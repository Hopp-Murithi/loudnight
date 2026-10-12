import "server-only"
import type { ServerSupabase } from "@/lib/supabase/server"
import { venuesRepository } from "./venues.repository"
import type { DemoVenue } from "./venues.schemas"

export const venuesService = {
  // Open to anyone: a demo venue counts as ready once the pipeline has finished a run for it.
  async listDemoVenues(supabase: ServerSupabase): Promise<DemoVenue[]> {
    const rows = await venuesRepository.listDemo(supabase)
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      venueType: row.venue_type,
      planReady: row.agent_runs.length > 0,
    }))
  },
}
