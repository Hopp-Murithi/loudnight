import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

type Counted = PromiseLike<{ count: number | null; error: { code?: string; message: string } | null }>
const total = async (query: Counted) => {
  const { count, error } = await query
  check(error)
  return count ?? 0
}

// One venue or one person, read through the administrator's own session so RLS still applies.
export const adminDetailRepository = {
  async venue(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("venues")
      .select(
        "id, name, city, country_code, address, venue_type, is_demo, created_at, suspended_at, suspended_reason, currency, time_zone",
      )
      .eq("id", venueId)
      .maybeSingle()
    check(error)
    return data
  },

  async team(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("venue_members")
      .select("user_id, role, profile:profiles!venue_members_user_id_fkey(display_name, email, is_anonymous)")
      .eq("venue_id", venueId)
      .order("created_at")
      .limit(50)
    check(error)
    return data ?? []
  },

  async settings(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("venue_settings")
      .select("quiet_nights, capacity, break_even_headcount, talent_budget_cents")
      .eq("venue_id", venueId)
      .maybeSingle()
    check(error)
    return data
  },

  async activity(supabase: ServerSupabase, venueId: string) {
    const [plans, last, published, rsvps, checkins] = await Promise.all([
      total(
        supabase
          .from("agent_runs")
          .select("id", { count: "exact", head: true })
          .eq("venue_id", venueId)
          .eq("mode", "encore"),
      ),
      supabase
        .from("agent_runs")
        .select("created_at")
        .eq("venue_id", venueId)
        .eq("mode", "encore")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      total(
        supabase
          .from("event_nights")
          .select("id", { count: "exact", head: true })
          .eq("venue_id", venueId)
          .eq("status", "published"),
      ),
      total(supabase.from("rsvps").select("id", { count: "exact", head: true }).eq("venue_id", venueId)),
      total(supabase.from("checkins").select("id", { count: "exact", head: true }).eq("venue_id", venueId)),
    ])
    check(last.error)
    return { plans, lastPlanAt: last.data?.created_at ?? null, published, rsvps, checkins }
  },

  async person(supabase: ServerSupabase, personId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, email, role, is_anonymous, is_active, created_at")
      .eq("id", personId)
      .maybeSingle()
    check(error)
    return data
  },

  async memberships(supabase: ServerSupabase, personId: string) {
    const { data, error } = await supabase
      .from("venue_members")
      .select("role, venue:venues!venue_members_venue_id_fkey(id, name)")
      .eq("user_id", personId)
      .limit(50)
    check(error)
    return data ?? []
  },
}
