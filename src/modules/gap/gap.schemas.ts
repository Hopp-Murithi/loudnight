import { z } from "zod"
import { GAP } from "@/config/gap"
import { plainDashes } from "@/lib/text"

export const scoutSchema = z.object({
  name: z.string(),
  type: z.string().nullable(),
  rating: z.number().nullable(),
  ratingCount: z.number().nullable(),
  hours: z.array(z.string()),
  website: z.string().nullable(),
})

export const nearbyVenueSchema = z.object({
  placeId: z.string(),
  name: z.string(),
  type: z.string(),
  rating: z.number().nullable(),
  distanceMetres: z.number().nullable(),
})

export const nearbyEventSchema = z.object({
  id: z.string(),
  name: z.string(),
  localDate: z.string(),
  venue: z.string().nullable(),
  genre: z.string().nullable(),
})

// The model sometimes names one theme twice; one chip per theme, with the counts added up.
function mergeThemes<T extends { theme: string; examples: string[]; count: number }>(list: T[]): T[] {
  const byName = new Map<string, T>()
  for (const item of list) {
    const key = item.theme.toLowerCase()
    const seen = byName.get(key)
    byName.set(
      key,
      seen
        ? {
            ...seen,
            count: seen.count + item.count,
            examples: [...new Set([...seen.examples, ...item.examples])].slice(0, 3),
          }
        : item,
    )
  }
  return [...byName.values()]
}

const clip = (max: number) => z.string().transform((text) => plainDashes(text).trim().slice(0, max))

// What the model returns. Strict about fields, so an instruction hidden in a name cannot add any; lenient on length.
export const themesSchema = z
  .object({
    themes: z
      .array(
        z
          .object({
            theme: clip(60).pipe(z.string().min(1)),
            examples: z.array(clip(120)).transform((list) => list.slice(0, 3)),
            count: z.number().int().min(1),
          })
          .strict(),
      )
      .transform((list) => mergeThemes(list).slice(0, GAP.maxThemes)),
  })
  .strict()

export const sourceStatusSchema = z.enum(["ok", "failed"])

export const gapScanSchema = z.object({
  weekday: z.string(),
  nights: z.array(z.string()),
  venues: z.array(nearbyVenueSchema),
  events: z.array(nearbyEventSchema),
  themes: themesSchema.shape.themes,
  sources: z.object({ places: sourceStatusSchema, events: sourceStatusSchema, themes: sourceStatusSchema }),
  noveltyNeutral: z.boolean(),
})

export type Scout = z.infer<typeof scoutSchema>
export type NearbyVenue = z.infer<typeof nearbyVenueSchema>
export type NearbyEvent = z.infer<typeof nearbyEventSchema>
export type CoveredTheme = z.infer<typeof themesSchema>["themes"][number]
export type GapScan = z.infer<typeof gapScanSchema>
