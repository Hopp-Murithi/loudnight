import "server-only"
import { z } from "zod"
import { PICTURES } from "@/config/integrations"
import { fetchUpstream } from "@/lib/http/upstream"

const artistSchema = z.object({ name: z.string(), nb_fan: z.number().nullish(), picture_xl: z.string().nullish() })
const answerSchema = z.object({ data: z.array(artistSchema).default([]) })

export type DeezerArtist = z.infer<typeof artistSchema>

// Artists whose names match a search, with their profile pictures.
export async function searchArtists(name: string): Promise<DeezerArtist[]> {
  const body = await fetchUpstream({
    service: "Deezer",
    url: `${PICTURES.deezer.url}/search/artist?q=${encodeURIComponent(name)}&limit=5`,
    timeoutMs: PICTURES.deezer.timeoutMs,
    schema: answerSchema,
  })
  return body.data
}
