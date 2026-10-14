import "server-only"
import { HISTORY_ACTIONS, HISTORY_FIELDS } from "@/config/history"
import type { ServerSupabase } from "@/lib/supabase/server"
import { historyRepository } from "./history.repository"

export interface HistoryEntry {
  id: number
  who: string
  what: string
  changed: string[]
  at: string
}

const FIELD_SKIP = ["updated_at", "id", "venue_id"]

export async function venueHistory(supabase: ServerSupabase, venueId: string, limit = 40): Promise<HistoryEntry[]> {
  const rows = await historyRepository.list(supabase, venueId, limit)
  const actorIds = [...new Set(rows.flatMap((row) => (row.actor_id ? [row.actor_id] : [])))]
  const people = new Map(
    (await historyRepository.names(supabase, actorIds)).map((person) => [
      person.id,
      person.display_name ?? person.email,
    ]),
  )
  return rows.map((row) => {
    const changed = ((row.metadata as { changed?: string[] } | null)?.changed ?? []).filter(
      (field) => !FIELD_SKIP.includes(field),
    )
    return {
      id: row.id,
      who: row.actor_id ? (people.get(row.actor_id) ?? "Someone on the team") : "Loudnight",
      what: HISTORY_ACTIONS[row.action] ?? "made a change",
      changed: changed.map((field) => HISTORY_FIELDS[field] ?? field.replace(/_/g, " ")),
      at: row.created_at,
    }
  })
}
