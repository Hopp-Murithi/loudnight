import "server-only"
import { fromDatabaseError } from "@/lib/http/errors"
import type { AdminSupabase } from "@/lib/supabase/admin"
import type { ServerSupabase } from "@/lib/supabase/server"
import type { Json } from "@/types/database"

type Client = ServerSupabase | AdminSupabase

const check = (error: { code?: string; message: string } | null) => {
  if (error) throw fromDatabaseError(error)
}

export interface NightInsert {
  starts_at: string
  variation: string
  slug: string
}

export const seriesRepository = {
  async findConcept(supabase: Client, conceptId: string) {
    const { data, error } = await supabase
      .from("concepts")
      .select("id, venue_id, run_id, name, pitch, format, themes, chosen_at")
      .eq("id", conceptId)
      .maybeSingle()
    check(error)
    return data
  },

  async runWeekday(supabase: Client, runId: string) {
    const { data, error } = await supabase.from("agent_runs").select("target_weekday").eq("id", runId).maybeSingle()
    check(error)
    return data?.target_weekday ?? null
  },

  // One call makes the series and its four nights, or nothing. The database decides who may.
  async create(supabase: Client, conceptId: string, startsOn: string, nights: NightInsert[]): Promise<string> {
    const { data, error } = await supabase.rpc("create_series", {
      p_concept_id: conceptId,
      p_starts_on: startsOn,
      p_nights: nights as unknown as Json,
    })
    check(error)
    return data ?? ""
  },

  async findByConcept(supabase: Client, conceptId: string) {
    const { data, error } = await supabase
      .from("series")
      .select("id, concept_id, status, event_nights(id, sequence, starts_at, variation, status)")
      .eq("concept_id", conceptId)
      .maybeSingle()
    check(error)
    return data
  },

  async findNight(supabase: ServerSupabase, nightId: string) {
    const { data, error } = await supabase
      .from("event_nights")
      .select("id, venue_id, status")
      .eq("id", nightId)
      .maybeSingle()
    check(error)
    return data
  },

  // Only a draft night can change here. Zero rows means it was published meanwhile, or is not the caller's to edit.
  async updateDraftNight(
    supabase: ServerSupabase,
    nightId: string,
    changes: { starts_at: string; variation: string },
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("event_nights")
      .update(changes)
      .eq("id", nightId)
      .eq("status", "draft")
      .select("id")
    check(error)
    return (data ?? []).length > 0
  },
}
