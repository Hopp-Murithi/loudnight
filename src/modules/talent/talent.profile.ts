import { z } from "zod"
import { plainDashes } from "@/lib/text"

export const TALENT_IMAGE_HOST = "images.qloo.com"

const CHANNELS = {
  instagram: { label: "Instagram", url: (id: string) => `https://www.instagram.com/${id}` },
  spotify: { label: "Spotify", url: (id: string) => `https://open.spotify.com/artist/${id}` },
  twitter: { label: "X", url: (id: string) => `https://x.com/${id}` },
  facebook: { label: "Facebook", url: (id: string) => `https://www.facebook.com/${id}` },
} as const

export type ChannelId = keyof typeof CHANNELS

export const profileSchema = z.object({
  imageUrl: z.string().nullable(),
  tagline: z.string().nullable(),
  knownFor: z.string().nullable(),
  genres: z.array(z.string()),
  songs: z.array(z.string()),
  isGroup: z.boolean(),
  listeners: z.number().nullable(),
  // Where Qloo says the act was born. Profiles stored before this was kept read as unknown.
  origin: z.string().nullable().default(null),
  // A household name in the venue's country, by the copy model's judgement; null when not asked.
  star: z.boolean().nullable().default(null),
  // The act's home country (ISO alpha-2) by the same check; null when unknown.
  home: z.string().nullable().default(null),
  channels: z.array(z.object({ id: z.string(), label: z.string(), url: z.string() })),
})

export type TalentProfile = z.infer<typeof profileSchema>

export const EMPTY_PROFILE: TalentProfile = {
  imageUrl: null,
  tagline: null,
  knownFor: null,
  genres: [],
  songs: [],
  isGroup: false,
  listeners: null,
  origin: null,
  star: null,
  home: null,
  channels: [],
}

type Loose = Record<string, unknown>
const object = (value: unknown): Loose =>
  (value && typeof value === "object" && !Array.isArray(value) ? value : {}) as Loose
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const text = (value: unknown, max: number): string | null =>
  typeof value === "string" && value.trim() && value.trim() !== "None" ? plainDashes(value.trim()).slice(0, max) : null
const texts = (value: unknown, count: number, max: number) =>
  list(value)
    .flatMap((item) => text(item, max) ?? [])
    .slice(0, count)

// Handles and ids go into links, so only plain account characters are accepted.
const handle = (value: unknown) => (typeof value === "string" && /^[A-Za-z0-9._-]{1,80}$/.test(value) ? value : null)

function image(value: unknown): string | null {
  const url = object(value).url
  if (typeof url !== "string") return null
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" && parsed.hostname === TALENT_IMAGE_HOST ? parsed.toString() : null
  } catch {
    return null
  }
}

const ENGLISH_WORDS =
  /\b(American|British|Canadian|English|Irish|Australian|comedian|writer|actor|actress|singer|songwriter|musician|band|artist|author|host|producer|known for)\b/
const PLAIN_LETTERS = /^[\x20-\x7E]+$/
const OTHER_LANGUAGE =
  /\b(de|del|la|el|los|las|y|und|der|die|das|et|le|les|du|van|uit|ja|och|og|estatunidenc|estadounidense|americano)\b/

// Qloo lists one line per language and tags only some. An untagged line counts only if it plainly reads as English.
function english(value: unknown): string | null {
  const entries = list(value).map(object)
  const tagged = entries.find((entry) => list(entry.languages).includes("en"))
  const untagged = entries.find(
    (entry) =>
      list(entry.languages).length === 0 &&
      typeof entry.value === "string" &&
      PLAIN_LETTERS.test(entry.value) &&
      ENGLISH_WORDS.test(entry.value) &&
      !OTHER_LANGUAGE.test(entry.value),
  )
  return text((tagged ?? untagged)?.value, 200)
}

// Musicians carry account lists ({ id }); people carry a single username under a different key.
function account(external: Loose, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = external[key]
    const found = handle(typeof value === "string" ? value : (object(list(value)[0]).id ?? list(value)[0]))
    if (found) return found
  }
  return null
}

function website(value: unknown): string | null {
  const raw = typeof value === "string" ? value : list(value)[0]
  if (typeof raw !== "string") return null
  try {
    const parsed = new URL(raw)
    return parsed.protocol === "https:" ? parsed.toString() : null
  } catch {
    return null
  }
}

// The account with the biggest audience is the act's real one when Qloo lists several under one name.
function spotify(value: unknown): { id: string | null; listeners: number | null } {
  const accounts = list(value)
    .map(object)
    .map((account) => ({
      id: handle(account.id),
      listeners: typeof account.monthly_listeners === "number" ? account.monthly_listeners : null,
    }))
    .sort((a, b) => (b.listeners ?? 0) - (a.listeners ?? 0))
  return accounts[0] ?? { id: null, listeners: null }
}

// The public profile Qloo holds for an act, cut down to what a booking card shows. Anything odd is dropped, never guessed.
export function profileFrom(entity: unknown): TalentProfile {
  const properties = object(object(entity).properties)
  const external = object(object(entity).external)
  const main = spotify(external.spotify)
  const ids: Record<ChannelId, string | null> = {
    instagram: account(external, "instagram", "instagram_username"),
    spotify: main.id ?? account(external, "spotify_artist_id"),
    twitter: account(external, "twitter", "twitter_username"),
    facebook: account(external, "facebook", "facebook_username"),
  }
  const site = website(properties.official_website)
  return {
    imageUrl: image(properties.image),
    tagline: english(properties.short_descriptions),
    knownFor: text(properties.known_for, 240),
    genres: texts(properties.primary_genres, 3, 40),
    songs: texts(properties.notable_songs, 3, 80),
    isGroup: properties.is_group === true,
    listeners: main.listeners,
    origin: text(properties.place_of_birth, 120),
    star: null,
    home: null,
    channels: [
      ...(site ? [{ id: "website", label: "Website", url: site }] : []),
      ...(Object.keys(CHANNELS) as ChannelId[]).flatMap((id) => {
        const name = ids[id]
        return name ? [{ id, label: CHANNELS[id].label, url: CHANNELS[id].url(name) }] : []
      }),
    ],
  }
}

// A stored profile read back. A row written before profiles existed, or a malformed one, shows as an empty profile.
export function readProfile(stored: unknown): TalentProfile {
  const parsed = profileSchema.safeParse(stored)
  return parsed.success ? parsed.data : EMPTY_PROFILE
}
