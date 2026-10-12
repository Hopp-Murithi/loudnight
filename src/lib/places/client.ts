import "server-only"
import { z } from "zod"
import { GOOGLE_PLACES } from "@/config/integrations"
import { placesEnv } from "@/lib/env/server"
import { fetchUpstream } from "@/lib/http/upstream"

const placeSchema = z.object({
  id: z.string(),
  displayName: z.object({ text: z.string() }).optional(),
  formattedAddress: z.string().optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  types: z.array(z.string()).optional(),
  primaryType: z.string().optional(),
  rating: z.number().optional(),
})

const placesSchema = z.object({ places: z.array(placeSchema).default([]) })

export type Place = z.infer<typeof placeSchema>

const FIELDS = ["id", "displayName", "formattedAddress", "location", "types", "primaryType", "rating"]

// Places API (New) bills by the fields requested, so every call names exactly what it needs.
function placesRequest(path: string, body: unknown) {
  return fetchUpstream({
    service: "Google Places",
    url: `${GOOGLE_PLACES.url}${path}`,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": placesEnv().GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": FIELDS.map((field) => `places.${field}`).join(","),
      },
      body: JSON.stringify(body),
    },
    timeoutMs: GOOGLE_PLACES.timeoutMs,
    schema: placesSchema,
  })
}

export async function searchPlaces(query: string): Promise<Place[]> {
  return (await placesRequest("/places:searchText", { textQuery: query, maxResultCount: 5 })).places
}

export async function placesNearby(
  center: { latitude: number; longitude: number },
  radiusM: number,
  includedTypes: string[],
): Promise<Place[]> {
  const body = {
    includedTypes,
    maxResultCount: 20,
    locationRestriction: { circle: { center, radius: radiusM } },
  }
  return (await placesRequest("/places:searchNearby", body)).places
}
