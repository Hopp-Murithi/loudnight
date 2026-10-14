import "server-only"
import { HISTORY_ACTIONS, HISTORY_FIELDS } from "@/config/history"
import type { ServerSupabase } from "@/lib/supabase/server"
import { historyRepository } from "./history.repository"

export interface HistoryEntry {
  id: number
  who: string
  // The venue the change belongs to, named only in the platform-wide log.
  venue: string | null
  what: string
  changed: string[]
  at: string
}

const FIELD_SKIP = ["updated_at", "id", "venue_id"]

export async function venueHistory(supabase: ServerSupabase, venueId: string, limit = 40): Promise<HistoryEntry[]> {
  return describe(supabase, await historyRepository.list(supabase, venueId, limit), false)
}

// Every venue's changes and the administrators' own actions, newest first. RLS limits it to administrators.
export async function platformHistory(
  supabase: ServerSupabase,
  limit: number,
  offset: number,
): Promise<HistoryEntry[]> {
  return describe(supabase, await historyRepository.list(supabase, null, limit, offset), true)
}

type AuditRow = Awaited<ReturnType<typeof historyRepository.list>>[number]

async function describe(supabase: ServerSupabase, rows: AuditRow[], withVenue: boolean): Promise<HistoryEntry[]> {
  const actorIds = [...new Set(rows.flatMap((row) => (row.actor_id ? [row.actor_id] : [])))]
  const venueIds = withVenue ? [...new Set(rows.flatMap((row) => (row.venue_id ? [row.venue_id] : [])))] : []
  const [names, venueNames] = await Promise.all([
    historyRepository.names(supabase, actorIds),
    historyRepository.venueNames(supabase, venueIds),
  ])
  const people = new Map(names.map((person) => [person.id, person.display_name ?? person.email]))
  const venues = new Map(venueNames.map((venue) => [venue.id, venue.name]))
  return rows.map((row) => {
    const changed = ((row.metadata as { changed?: string[] } | null)?.changed ?? []).filter(
      (field) => !FIELD_SKIP.includes(field),
    )
    return {
      id: row.id,
      who: row.actor_id ? (people.get(row.actor_id) ?? "Someone on the team") : "Loudnight",
      venue: row.venue_id ? (venues.get(row.venue_id) ?? null) : null,
      what: HISTORY_ACTIONS[row.action] ?? "made a change",
      changed: changed.map((field) => HISTORY_FIELDS[field] ?? field.replace(/_/g, " ")),
      at: row.created_at,
    }
  })
}
