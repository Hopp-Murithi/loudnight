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

// Acts from open records for the kinds of night Qloo knows few performers for. Never fails the search: an
// unreachable source simply adds nobody.
export async function openActs(admin: AdminSupabase, search: OpenSearch, venue: OpenVenue): Promise<OpenAct[]> {
  try {
    const found: OpenAct[] = []
    if (search.roles.length > 0) {
      const near = nearbyQuery(search.roles, venue.point)
      found.push(...actsFromWikidata(await cached<WikidataRow[]>(admin, "wikidata", near, () => sparql(near))))
      if (found.length < OPEN_TALENT.keep && venue.countryCode) {
        const wide = countryQuery(search.roles, venue.countryCode)
        const more = actsFromWikidata(await cached<WikidataRow[]>(admin, "wikidata", wide, () => sparql(wide)))
        found.push(...more.filter((act) => !found.some((known) => known.entityId === act.entityId)))
      }
    }
    if (search.townMusicians) {
      // The town first; the whole country when the town has few musicians on record.
      const places = [venue.town?.split(",")[0].trim(), venue.countryCode ? countryName(venue.countryCode) : null]
      for (const place of places) {
        if (!place || found.filter((act) => act.source === "musicbrainz").length >= OPEN_TALENT.keep) continue
        const artists = await cached<MusicBrainzArtist[]>(admin, "musicbrainz", place, () =>
          artistsFrom(place, OPEN_TALENT.fetch),
        )
        found.push(
          ...actsFromMusicBrainz(artists).filter((act) => !found.some((known) => known.entityId === act.entityId)),
        )
      }
    }
    return found
  } catch {
    return []
  }
}
