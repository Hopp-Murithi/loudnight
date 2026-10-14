import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

// Every query runs with the caller's own client: door staff read names and arrivals, never contacts or money.
export const doorRepository = {
  // The published night the door is for: the first one that has not finished yet.
  async currentNight(supabase: ServerSupabase, venueId: string, notBefore: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select("id, venue_id, public_slug, title, starts_at, status")
      .eq("venue_id", venueId)
      .eq("status", "published")
      .gte("starts_at", notBefore)
      .order("starts_at")
      .limit(1)
      .maybeSingle()
    check(error)
    return data
  },

  async findNight(supabase: ServerSupabase, nightId: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select("id, venue_id, public_slug, title, starts_at, status")
      .eq("id", nightId)
      .maybeSingle()
    check(error)
    return data
  },

  async guestList(supabase: ServerSupabase, nightId: string) {
    const { data, error } = await supabase
      .from("rsvps")
      .select("id, guest_name, party_size, created_at")
      .eq("event_night_id", nightId)
      .order("guest_name")
      .limit(1000)
    check(error)
    return data ?? []
  },

  async arrivals(supabase: ServerSupabase, nightId: string) {
    const { data, error } = await supabase
      .from("checkins")
      .select("id, rsvp_id, party_size, created_at")
      .eq("event_night_id", nightId)
      .order("created_at", { ascending: false })
      .limit(2000)
    check(error)
    return data ?? []
  },

  async rsvpByCode(supabase: ServerSupabase, code: string) {
    const { data, error } = await supabase
      .from("rsvps")
      .select("id, event_night_id, venue_id, guest_name, party_size")
      .eq("checkin_code", code)
      .maybeSingle()
    check(error)
    return data
  },

  async rsvpById(supabase: ServerSupabase, rsvpId: string) {
    const { data, error } = await supabase
      .from("rsvps")
      .select("id, event_night_id, venue_id, guest_name, party_size")
      .eq("id", rsvpId)
      .maybeSingle()
    check(error)
    return data
  },

  async arrivalOf(supabase: ServerSupabase, rsvpId: string) {
    const { data, error } = await supabase.from("checkins").select("created_at").eq("rsvp_id", rsvpId).maybeSingle()
    check(error)
    return data?.created_at ?? null
  },

  // The error code, if any, is the caller's to read: a second scan of one ticket is a unique violation.
  async addArrival(
    supabase: ServerSupabase,
    row: { event_night_id: string; venue_id: string; rsvp_id?: string; party_size: number },
  ): Promise<{ at: string | null; failure: string | null }> {
    const { data, error } = await supabase.from("checkins").insert(row).select("created_at").maybeSingle()
    return { at: data?.created_at ?? null, failure: error?.code ?? null }
  },

  // Null for door staff: RLS hides the night's takings from anyone who is not an owner or a manager.
  async loggedSpend(supabase: ServerSupabase, nightId: string) {
    const { data, error } = await supabase
      .from("night_spend")
      .select("spend_cents")
      .eq("event_night_id", nightId)
      .maybeSingle()
    check(error)
    return data?.spend_cents ?? null
  },

  // Update first, then insert: a session may change only the amount on an existing row, never its night or venue.
  async saveSpend(supabase: ServerSupabase, nightId: string, venueId: string, spendCents: number) {
    const updated = await supabase
      .from("night_spend")
      .update({ spend_cents: spendCents, updated_at: new Date().toISOString() })
      .eq("event_night_id", nightId)
      .select("event_night_id")
    check(updated.error)
    if ((updated.data ?? []).length > 0) return
    const inserted = await supabase
      .from("night_spend")
      .insert({ event_night_id: nightId, venue_id: venueId, spend_cents: spendCents })
    check(inserted.error)
  },

  // A guest checking themselves in cannot read the row back, so nothing is selected.
  async addSelfArrival(
    supabase: ServerSupabase,
    row: { event_night_id: string; venue_id: string; party_size: number },
  ) {
    const { error } = await supabase.from("checkins").insert(row)
    return error?.code ?? null
  },

  // Results across nights, three queries in all: the nights, then everyone and everything for them at once.
  async publicNights(supabase: ServerSupabase, venueId: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select("id, public_slug, title, starts_at, status")
      .eq("venue_id", venueId)
      .in("status", ["published", "cancelled"])
      .order("starts_at", { ascending: false })
      .limit(12)
    check(error)
    return data ?? []
  },

  async attendanceFor(supabase: ServerSupabase, nightIds: string[]) {
    if (nightIds.length === 0) return { rsvps: [], arrivals: [], spend: [] }
    const [rsvps, arrivals, spend] = await Promise.all([
      supabase.from("rsvps").select("id, event_night_id, party_size").in("event_night_id", nightIds).limit(5000),
      supabase
        .from("checkins")
        .select("event_night_id, rsvp_id, party_size")
        .in("event_night_id", nightIds)
        .limit(10000),
      supabase.from("night_spend").select("event_night_id, spend_cents").in("event_night_id", nightIds),
    ])
    check(rsvps.error)
    check(arrivals.error)
    check(spend.error)
    return { rsvps: rsvps.data ?? [], arrivals: arrivals.data ?? [], spend: spend.data ?? [] }
  },
}
