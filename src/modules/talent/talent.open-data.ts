import "server-only"
import { createHash } from "node:crypto"
import { countryName } from "@/config/countries"
import { OPEN_DATA } from "@/config/integrations"
import { OPEN_TALENT, type OpenSource } from "@/config/series"
import { artistsFrom, type MusicBrainzArtist } from "@/lib/musicbrainz/client"
import type { AdminSupabase } from "@/lib/supabase/admin"
import { sparql, type WikidataRow } from "@/lib/wikidata/client"
import type { Json } from "@/types/database"
import { openDataRepository } from "./open-data.repository"
import {
  actsFromMusicBrainz,
  actsFromWikidata,
  countryQuery,
  nearbyQuery,
  type OpenAct,
  type OpenSearch,
} from "./talent.open"

const DAY_MS = 86_400_000

// A fresh stored answer is reused; a stale one is refreshed, and kept if the refresh fails.
async function cached<T>(admin: AdminSupabase, source: OpenSource, request: string, ask: () => Promise<T>) {
  const requestHash = createHash("sha256").update(`${source}\n${request}`).digest("hex")
  const stored = await openDataRepository.find(admin, requestHash)
  if (stored && new Date(stored.expires_at).getTime() > Date.now()) return stored.response as T
  try {
    const response = await ask()
    await openDataRepository.store(admin, {
      source,
      requestHash,
      request,
      response: response as Json,
      expiresAt: new Date(Date.now() + OPEN_DATA.cacheTtlDays * DAY_MS).toISOString(),
    })
    return response
  } catch (error) {
    if (stored) return stored.response as T
    throw error
  }
}

export interface OpenVenue {
  point: { latitude: number; longitude: number }
  countryCode: string | null
  town: string | null
}

// Acts from open records for the kinds of night Qloo knows few performers for. Every search runs at once and fails
// on its own: an unreachable source adds nobody, and never takes the others' answers with it.
export async function openActs(admin: AdminSupabase, search: OpenSearch, venue: OpenVenue): Promise<OpenAct[]> {
  const wikidata = (query: string) =>
    cached<WikidataRow[]>(admin, "wikidata", query, () => sparql(query)).then(actsFromWikidata)
  const musicbrainz = (place: string) =>
    cached<MusicBrainzArtist[]>(admin, "musicbrainz", place, () => artistsFrom(place, OPEN_TALENT.fetch)).then(
      actsFromMusicBrainz,
    )
  const town = venue.town?.split(",")[0].trim()
  const country = venue.countryCode
  const searches = [
    ...(search.roles.length > 0 ? [wikidata(nearbyQuery(search.roles, venue.point))] : []),
    ...(search.roles.length > 0 && country ? [wikidata(countryQuery(search.roles, country))] : []),
    ...(search.townMusicians && town ? [musicbrainz(town)] : []),
    ...(search.townMusicians && country ? [musicbrainz(countryName(country))] : []),
  ]
  const answers = await Promise.allSettled(searches)
  const found = answers.flatMap((answer) => (answer.status === "fulfilled" ? answer.value : []))
  return found.filter((act, index) => found.findIndex((other) => other.entityId === act.entityId) === index)
}
