import "server-only"
import { z } from "zod"
import { OPEN_DATA } from "@/config/integrations"
import { fetchUpstream } from "@/lib/http/upstream"

const artistSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string().nullish(),
  disambiguation: z.string().nullish(),
  area: z.object({ name: z.string() }).nullish(),
  "begin-area": z.object({ name: z.string() }).nullish(),
  "life-span": z.object({ ended: z.boolean().nullish() }).nullish(),
  tags: z.array(z.object({ name: z.string(), count: z.number().optional() })).nullish(),
})

const answerSchema = z.object({ artists: z.array(artistSchema) })

export type MusicBrainzArtist = z.infer<typeof artistSchema>

// Artists who come from, or are based in, a named town or city.
export async function artistsFrom(area: string, limit: number): Promise<MusicBrainzArtist[]> {
  const name = area.replace(/["\\]/g, "")
  const query = `(area:"${name}" OR beginarea:"${name}")`
  const body = await fetchUpstream({
    service: "MusicBrainz",
    url: `${OPEN_DATA.musicbrainz.url}/artist?query=${encodeURIComponent(query)}&fmt=json&limit=${limit}`,
    init: { headers: { "User-Agent": OPEN_DATA.userAgent, Accept: "application/json" } },
    timeoutMs: OPEN_DATA.musicbrainz.timeoutMs,
    schema: answerSchema,
    retryOnRateLimit: true,
  })
  return body.artists
}
