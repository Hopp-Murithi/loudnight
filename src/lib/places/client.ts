import "server-only"
import { z, type ZodType } from "zod"
import { GOOGLE_PLACES } from "@/config/integrations"
import { placesEnv } from "@/lib/env/server"
import { fetchUpstream } from "@/lib/http/upstream"

const text = z.object({ text: z.string() })

const placeSchema = z.object({
  id: z.string(),
  displayName: text.optional(),
  formattedAddress: z.string().optional(),
  location: z.object({ latitude: z.number(), longitude: z.number() }).optional(),
  types: z.array(z.string()).optional(),
  primaryType: z.string().optional(),
  primaryTypeDisplayName: text.optional(),
  rating: z.number().optional(),
  userRatingCount: z.number().optional(),
  addressComponents: z
    .array(z.object({ longText: z.string().optional(), shortText: z.string().optional(), types: z.array(z.string()) }))
    .optional(),
  timeZone: z.object({ id: z.string().optional() }).optional(),
})

const placesSchema = z.object({ places: z.array(placeSchema).default([]) })

const detailsSchema = placeSchema.extend({
  regularOpeningHours: z.object({ weekdayDescriptions: z.array(z.string()).default([]) }).optional(),
  priceLevel: z.string().optional(),
  websiteUri: z.string().optional(),
})

export type Place = z.infer<typeof placeSchema>
export type PlaceDetails = z.infer<typeof detailsSchema>

const LIST_FIELDS = [
  "id",
  "displayName",
  "formattedAddress",
  "location",
  "types",
  "primaryType",
  "primaryTypeDisplayName",
  "rating",
  "userRatingCount",
]
const DETAIL_FIELDS = [
  "id",
  "displayName",
  "primaryType",
  "primaryTypeDisplayName",
  "rating",
  "userRatingCount",
  "regularOpeningHours.weekdayDescriptions",
  "priceLevel",
  "websiteUri",
]

// Places API (New) bills by the fields requested, so every call names exactly what it needs.
function placesCall<T>(path: string, fieldMask: string, schema: ZodType<T>, body?: unknown): Promise<T> {
  return fetchUpstream({
    service: "Google Places",
    url: `${GOOGLE_PLACES.url}${path}`,
    init: {
      method: body === undefined ? "GET" : "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": placesEnv().GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    },
    timeoutMs: GOOGLE_PLACES.timeoutMs,
    schema,
  })
}

const listMask = LIST_FIELDS.map((field) => `places.${field}`).join(",")
// Choosing a venue also needs its town, country and time zone. The nearby scan does not, so it does not pay for them.
const searchMask = [...LIST_FIELDS, "addressComponents", "timeZone"].map((field) => `places.${field}`).join(",")

export async function searchPlaces(query: string): Promise<Place[]> {
  return (await placesCall("/places:searchText", searchMask, placesSchema, { textQuery: query, maxResultCount: 5 }))
    .places
}

// Matches on the primary type only. `includedTypes` also matches secondary types, which pulled in bakeries for "bar".
export async function placesNearby(
  center: { latitude: number; longitude: number },
  radiusM: number,
  primaryTypes: readonly string[],
): Promise<Place[]> {
  const body = {
    includedPrimaryTypes: primaryTypes,
    maxResultCount: 20,
    locationRestriction: { circle: { center, radius: radiusM } },
  }
  return (await placesCall("/places:searchNearby", listMask, placesSchema, body)).places
}

export async function placeDetails(placeId: string): Promise<PlaceDetails> {
  return placesCall(`/places/${encodeURIComponent(placeId)}`, DETAIL_FIELDS.join(","), detailsSchema)
}
