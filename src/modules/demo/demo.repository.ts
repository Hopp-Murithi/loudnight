import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"

const SETTINGS = "search_radius_m, slow_night, capacity, capabilities, break_even_headcount"
const MONEY = "talent_budget_cents, average_spend_cents"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

export const demoRepository = {
  // Read with the visitor's own client: RLS and the anonymous column grants decide what a judge may see.
  async findVenue(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("venues")
      .select(`id, name, address, city, currency, venue_type, time_zone, is_demo, venue_settings(${SETTINGS})`)
      .eq("id", venueId)
      .eq("is_demo", true)
      .maybeSingle()
    check(error)
    return data
  },

  async latestPlan(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("agent_runs")
      .select("id, created_at")
      .eq("venue_id", venueId)
      .eq("mode", "encore")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    check(error)
    return data
  },

  async listDemoIds(admin: AdminSupabase): Promise<string[]> {
    const { data, error } = await admin.from("venues").select("id").eq("is_demo", true).order("name").limit(12)
    check(error)
    return (data ?? []).map((row) => row.id)
  },

  async venueForUpkeep(admin: AdminSupabase, venueId: string) {
    const { data, error } = await admin
      .from("venues")
      .select(
        `id, name, address, city, currency, venue_type, google_place_id, latitude, longitude, time_zone, is_demo, venue_settings(${SETTINGS}, ${MONEY})`,
      )
      .eq("id", venueId)
      .maybeSingle()
    check(error)
    return data
  },

  async topConceptId(admin: AdminSupabase, runId: string): Promise<string | null> {
    const { data, error } = await admin
      .from("concepts")
      .select("id")
      .eq("run_id", runId)
      .eq("is_shortlisted", true)
      .order("rank")
      .limit(1)
      .maybeSingle()
    check(error)
    return data?.id ?? null
  },

  async markChosen(admin: AdminSupabase, conceptId: string): Promise<void> {
    const { error } = await admin.from("concepts").update({ chosen_at: new Date().toISOString() }).eq("id", conceptId)
    check(error)
  },

  async deleteRuns(admin: AdminSupabase, runIds: string[]): Promise<void> {
    if (runIds.length === 0) return
    const { error } = await admin.from("agent_runs").delete().in("id", runIds)
    check(error)
  },

  async runIdsFor(admin: AdminSupabase, venueId: string): Promise<string[]> {
    const { data, error } = await admin.from("agent_runs").select("id").eq("venue_id", venueId).limit(200)
    check(error)
    return (data ?? []).map((row) => row.id)
  },
}
