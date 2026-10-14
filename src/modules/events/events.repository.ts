import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Database, Enums } from "@/types/database"

type NightUpdate = Database["public"]["Tables"]["event_nights"]["Update"]
type NightStatus = Enums<"night_status">

const PUBLIC_NIGHT =
  "id, venue_id, series_id, sequence, starts_at, status, title, blurb, lineup, variation, public_slug"

export const eventsRepository = {
  // Only the public statuses, even for a signed-in team member who could also read the drafts.
  async findPublicNight(supabase: ServerSupabase, slug: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select(PUBLIC_NIGHT)
      .eq("public_slug", slug)
      .in("status", ["published", "cancelled"])
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data
  },

  async findPublicVenue(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("venues")
      .select("id, name, address, city, time_zone, latitude, longitude, suspended_at")
      .eq("id", venueId)
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data
  },

  async nextPublishedNight(supabase: ServerSupabase, seriesId: string, after: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select("public_slug")
      .eq("series_id", seriesId)
      .eq("status", "published")
      .gt("starts_at", after)
      .order("starts_at")
      .limit(1)
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data?.public_slug ?? null
  },

  // The RSVP and its contact in one transaction, under the guest's own rights. The error code is the caller's to read.
  async reservePlace(
    supabase: ServerSupabase,
    args: { nightId: string; name: string; partySize: number; contact: string | null; code: string },
  ): Promise<string | null> {
    const { error } = await supabase.rpc("reserve_place", {
      p_night_id: args.nightId,
      p_guest_name: args.name,
      p_party_size: args.partySize,
      // The function takes null for "no contact"; the generated types cannot say so.
      p_contact: args.contact as string,
      p_checkin_code: args.code,
    })
    return error?.code ?? null
  },

  async findNight(supabase: ServerSupabase, nightId: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select("id, venue_id, series_id, status, sequence")
      .eq("id", nightId)
      .maybeSingle()
    if (error) throw fromDatabaseError(error)
    return data
  },

  async countRsvps(supabase: ServerSupabase, nightId: string): Promise<number> {
    const { count, error } = await supabase
      .from("rsvps")
      .select("id", { count: "exact", head: true })
      .eq("event_night_id", nightId)
    if (error) throw fromDatabaseError(error)
    return count ?? 0
  },

  // Moves a night on only from the statuses given, so two quick taps cannot skip a step. Zero rows means refused.
  async moveNight(supabase: ServerSupabase, nightId: string, from: NightStatus[], changes: NightUpdate) {
    const { data, error } = await supabase
      .from("event_nights")
      .update(changes)
      .eq("id", nightId)
      .in("status", from)
      .select("id")
    if (error) throw fromDatabaseError(error)
    return (data ?? []).length > 0
  },
}
