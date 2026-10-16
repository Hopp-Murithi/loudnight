import "server-only"
import { z } from "zod"
import { PICTURES } from "@/config/integrations"
import { fetchUpstream } from "@/lib/http/upstream"

const albumSchema = z.object({ artistName: z.string(), artworkUrl100: z.string().nullish() })
const answerSchema = z.object({ results: z.array(albumSchema).default([]) })

export type ItunesAlbum = z.infer<typeof albumSchema>

// Albums whose artist matches a search, with their cover art.
export async function searchAlbums(name: string): Promise<ItunesAlbum[]> {
  const body = await fetchUpstream({
    service: "iTunes",
    url: `${PICTURES.itunes.url}/search?term=${encodeURIComponent(name)}&entity=album&limit=5`,
    timeoutMs: PICTURES.itunes.timeoutMs,
    schema: answerSchema,
  })
  return body.results
}
