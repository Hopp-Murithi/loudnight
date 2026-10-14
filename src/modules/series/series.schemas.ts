import { z } from "zod"
import { SERIES, type PopularityTier, type TalentSource } from "@/config/series"
import type { Reach } from "@/config/talent-reach"
import { plainDashes } from "@/lib/text"
import type { TalentProfile } from "@/modules/talent/talent.profile"
import type { Enums } from "@/types/database"
import { hasDigits } from "./series.dates"

const variation = z
  .string()
  .transform((text) => plainDashes(text).trim().slice(0, SERIES.variationMax))
  .pipe(z.string().min(10))
  .refine((text) => !hasDigits(text), "No numbers")

// What the copywriter must hand back: four different twists, in order, with no numbers in them.
export const variationsSchema = z
  .object({ variations: z.array(variation).length(SERIES.nights) })
  .strict()
  .refine(({ variations }) => new Set(variations.map((text) => text.toLowerCase())).size === SERIES.nights, {
    message: "Each week needs its own twist",
  })

export const nightEditSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date"),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Pick a start time"),
  variation: z.string().trim().min(1, "Say what makes this week different").max(400, "Keep it under 400 characters"),
})

export const outreachEditSchema = z.object({
  message: z.string().trim().min(1, "The message cannot be empty").max(4000, "Keep it under 4,000 characters"),
})

export type NightEditInput = z.infer<typeof nightEditSchema>
export type OutreachEditInput = z.infer<typeof outreachEditSchema>

// One change at a time: new wording for the message, or whether the act is booked.
export const talentEditSchema = z.union([outreachEditSchema, z.object({ booked: z.boolean() })])
export type TalentEditInput = z.infer<typeof talentEditSchema>

export interface NightView {
  id: string
  sequence: number
  startsAt: string
  localDate: string
  localTime: string
  variation: string
  status: Enums<"night_status">
  slug: string
}

export interface TalentView {
  id: string
  name: string
  tier: PopularityTier
  overlap: number
  fitSignals: string[]
  message: string | null
  edited: boolean
  hasReceipt: boolean
  booked: boolean
  bookedAt: string | null
  source: TalentSource
  // Null when the caller cannot see money (door staff) or did not ask.
  reach: Reach | null
  profile: TalentProfile
}

export interface SeriesView {
  id: string
  conceptId: string
  status: Enums<"series_status">
  nights: NightView[]
}

// Everything the Series page shows for the chosen night. Each part is null or empty until it has been made.
export interface SeriesBoard {
  series: SeriesView | null
  talent: TalentView[]
  references: TalentView[]
}
