import "server-only"
import { fromDatabaseError, unwrap } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Database } from "@/types/database"

type CreateVenueArgs = Database["public"]["Functions"]["create_venue"]["Args"]
type VenueUpdate = Database["public"]["Tables"]["venues"]["Update"]
type SettingsUpdate = Database["public"]["Tables"]["venue_settings"]["Update"]

const VENUE_COLUMNS =
  "id, name, address, venue_type, google_place_id, latitude, longitude, time_zone, country_code, city, currency"
const SETTINGS_COLUMNS =
  "slow_night, break_even_headcount, capacity, capabilities, hosts, atmosphere, talent_budget_cents, average_spend_cents, search_radius_m"

const check = ({ error }: { error: { code?: string } | null }) => {
  if (error) throw fromDatabaseError(error)
}

export const venuesRepository = {
  async listDemo(supabase: ServerSupabase) {
    return unwrap(
      await supabase
        .from("venues")
        .select("id, name, address, city, venue_type, agent_runs(status)")
        .eq("is_demo", true)
        .eq("agent_runs.status", "succeeded")
        .order("name")
        .limit(12),
    )
  },

  // The person's own memberships; RLS also limits venue_members to venues they belong to.
  async listMemberships(supabase: ServerSupabase, userId: string) {
    return unwrap(
      await supabase
        .from("venue_members")
        .select("role, venue:venues!inner(id, name, address, city, venue_type)")
        .eq("user_id", userId)
        .order("created_at")
        .limit(50),
    )
  },

  async findMembership(supabase: ServerSupabase, venueId: string, userId: string) {
    const { data, error } = await supabase
      .from("venue_members")
      .select("role")
      .eq("venue_id", venueId)
      .eq("user_id", userId)
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data
  },

  async findVenue(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase.from("venues").select(VENUE_COLUMNS).eq("id", venueId).maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data
  },

  async findSettings(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("venue_settings")
      .select(SETTINGS_COLUMNS)
      .eq("venue_id", venueId)
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data
  },

  async create(supabase: ServerSupabase, args: CreateVenueArgs): Promise<string> {
    const { data, error } = await supabase.rpc("create_venue", args)
    if (error || !data) throw fromDatabaseError(error ?? {})
    return data
  },

  // RLS turns a write someone may not make into zero rows, so the caller learns whether it happened.
  async updateVenue(supabase: ServerSupabase, venueId: string, changes: VenueUpdate): Promise<boolean> {
    const result = await supabase.from("venues").update(changes).eq("id", venueId).select("id")
    check(result)
    return (result.data?.length ?? 0) > 0
  },

  async updateSettings(supabase: ServerSupabase, venueId: string, changes: SettingsUpdate): Promise<boolean> {
    const result = await supabase.from("venue_settings").update(changes).eq("venue_id", venueId).select("venue_id")
    check(result)
    return (result.data?.length ?? 0) > 0
  },

  async remove(supabase: ServerSupabase, venueId: string): Promise<boolean> {
    const result = await supabase.from("venues").delete().eq("id", venueId).select("id")
    check(result)
    return (result.data?.length ?? 0) > 0
  },
}
