import { OPEN_TALENT, type OpenRole, type OpenSource } from "@/config/series"
import { plainDashes } from "@/lib/text"
import type { MusicBrainzArtist } from "@/lib/musicbrainz/client"
import type { WikidataRow } from "@/lib/wikidata/client"
import { EMPTY_PROFILE } from "./talent.profile"
import type { RankedAct } from "./talent.tiers"

export interface OpenSearch {
  roles: OpenRole[]
  townMusicians: boolean
}

export type OpenAct = RankedAct & { source: OpenSource }

const NAME_ROLES: [RegExp, OpenRole][] = [
  [/poe|spoken|verse|slam/i, "poet"],
  [/comed|stand.?up|laugh|joke/i, "comedian"],
]
const HOST_ROLES: Partial<Record<string, OpenRole>> = { poetry: "poet", comedy: "comedian" }
const OPEN_FORMATS = ["talk", "other"]

// Which open records suit a night: DJs for a DJ night, town musicians for live music, and poets or comedians when the
// night's name says so, or when an open format night happens in a room that hosts them.
export function openSearchFor(format: string, hosts: readonly string[], nightName: string): OpenSearch {
  if (format === "dj_night") return { roles: ["dj"], townMusicians: false }
  if (format === "live_music") return { roles: [], townMusicians: true }
  const named = NAME_ROLES.filter(([pattern]) => pattern.test(nightName)).map(([, role]) => role)
  const hosted = OPEN_FORMATS.includes(format) ? hosts.flatMap((host) => HOST_ROLES[host] ?? []) : []
  return { roles: [...new Set(named.length > 0 ? named : hosted)], townMusicians: false }
}

const occupations = (roles: OpenRole[]) =>
  roles.flatMap((role) => OPEN_TALENT.roles[role].map((id) => `wd:${id}`)).join(" ")

const filters = `
  FILTER (?links <= ${OPEN_TALENT.maxLanguages})
  FILTER NOT EXISTS { ?p wdt:P570 [] }
  FILTER NOT EXISTS { ?p wdt:P569 ?dob . FILTER (YEAR(?dob) < ${OPEN_TALENT.bornAfter}) }
  OPTIONAL { ?p schema:description ?desc . FILTER (LANG(?desc) = "en") }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }`

// Living people in these roles born within reach of the venue, best known first but never household names.
export function nearbyQuery(roles: OpenRole[], point: { latitude: number; longitude: number }): string {
  const centre = `Point(${point.longitude.toFixed(4)} ${point.latitude.toFixed(4)})`
  return `SELECT DISTINCT ?p ?pLabel ?birthLabel ?links ?desc WHERE {
  VALUES ?occ { ${occupations(roles)} }
  ?p wdt:P106 ?occ; wdt:P19 ?birth; wikibase:sitelinks ?links.
  SERVICE wikibase:around { ?birth wdt:P625 ?loc. bd:serviceParam wikibase:center "${centre}"^^geo:wktLiteral; wikibase:radius "${OPEN_TALENT.nearbyKm}". }${filters}
} ORDER BY DESC(?links) LIMIT ${OPEN_TALENT.fetch}`
}

// The same, across the venue's whole country, for towns with few people on record.
export function countryQuery(roles: OpenRole[], countryCode: string): string {
  return `SELECT DISTINCT ?p ?pLabel ?birthLabel ?links ?desc WHERE {
  ?country wdt:P297 "${countryCode.replace(/[^A-Z]/g, "")}" .
  VALUES ?occ { ${occupations(roles)} }
  ?p wdt:P106 ?occ; wdt:P27 ?country; wikibase:sitelinks ?links.
  OPTIONAL { ?p wdt:P19 ?birth }${filters}
} ORDER BY DESC(?links) LIMIT ${OPEN_TALENT.fetch}`
}

const ITEM = /^https?:\/\/www\.wikidata\.org\/entity\/(Q\d+)$/
const UNLABELLED = /^Q\d+$/
const clean = (value: string | null | undefined, max: number) =>
  value && value.trim() && !UNLABELLED.test(value.trim()) ? plainDashes(value.trim()).slice(0, max) : null

// Fame from how many Wikipedia languages describe the person, on Qloo's zero to one scale.
const fameOf = (languages: number) => Math.min(0.79, Math.max(0, languages) / 30)

export function actsFromWikidata(rows: WikidataRow[]): OpenAct[] {
  const seen = new Set<string>()
  return rows.flatMap((row, index) => {
    const id = ITEM.exec(row.p ?? "")?.[1]
    const name = clean(row.pLabel, 200)
    if (!id || !name || seen.has(id)) return []
    seen.add(id)
    return [
      {
        entityId: `wikidata:${id}`,
        name,
        popularity: fameOf(Number(row.links ?? 0)),
        affinity: 0,
        index,
        source: "wikidata" as const,
        profile: {
          ...EMPTY_PROFILE,
          tagline: clean(row.desc, 200),
          origin: clean(row.birthLabel, 120),
          channels: [{ id: "wikidata", label: "Wikidata", url: `https://www.wikidata.org/wiki/${id}` }],
        },
      },
    ]
  })
}

const MBID = /^[0-9a-f-]{36}$/

// Working musicians only: not disbanded, a person or a group, tagged with a style, and a real id to link to.
export function actsFromMusicBrainz(artists: MusicBrainzArtist[]): OpenAct[] {
  return artists.flatMap((artist, index) => {
    const name = clean(artist.name, 200)
    const kind = artist.type ?? "Person"
    const working = !artist["life-span"]?.ended && ["Person", "Group"].includes(kind) && (artist.tags ?? []).length > 0
    if (!name || !MBID.test(artist.id) || !working) return []
    return [
      {
        entityId: `musicbrainz:${artist.id}`,
        name,
        popularity: null,
        affinity: 0,
        index,
        source: "musicbrainz" as const,
        profile: {
          ...EMPTY_PROFILE,
          tagline: clean(artist.disambiguation, 200),
          origin: clean(artist["begin-area"]?.name ?? artist.area?.name, 120),
          genres: (artist.tags ?? []).slice(0, 2).flatMap((tag) => clean(tag.name, 40) ?? []),
          isGroup: kind === "Group",
          channels: [{ id: "musicbrainz", label: "MusicBrainz", url: `https://musicbrainz.org/artist/${artist.id}` }],
        },
      },
    ]
  })
}
