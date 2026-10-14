import { z } from "zod"
import { AD_LANGUAGES } from "@/config/ad-copy"
import { AD_DEFAULT, AD_LINE_MAX, AD_LINK_MAX, AD_PALETTES, AD_PHOTOS, AD_TEMPLATES } from "@/config/promote"
import type { NightView } from "@/modules/series/series.schemas"

const ids = <T extends { id: string }>(items: readonly T[]) => items.map((item) => item.id) as [T["id"], ...T["id"][]]

const isHttps = (value: string) => {
  try {
    return new URL(value).protocol === "https:"
  } catch {
    return false
  }
}

// The owner's choices for one night's ad. Everything else on the ad comes from stored facts.
export const adDesignSchema = z.object({
  template: z.enum(ids(AD_TEMPLATES)),
  palette: z.enum(Object.keys(AD_PALETTES) as [keyof typeof AD_PALETTES, ...(keyof typeof AD_PALETTES)[]]),
  photo: z.enum(AD_PHOTOS),
  line: z.string().trim().max(AD_LINE_MAX, `Keep it under ${AD_LINE_MAX} characters`),
  language: z.enum(ids(AD_LANGUAGES)).default("en"),
  link: z
    .string()
    .trim()
    .max(AD_LINK_MAX, "That link is too long")
    .refine((value) => value === "" || isHttps(value), "Use a full link that starts with https://")
    .default(""),
})

export type AdDesign = z.infer<typeof adDesignSchema>

// A design saved before a field existed, or never saved, falls back to the default rather than failing.
export function readDesign(stored: unknown): AdDesign {
  const parsed = adDesignSchema.safeParse(stored)
  return parsed.success ? parsed.data : { ...AD_DEFAULT }
}

// What is written on the ad: at most four pieces of text, plus a QR code when there is a ticket link.
export interface AdContent {
  kicker: string
  title: string
  weekday: string
  month: string
  day: string
  dateLine: string
  line: string | null
  link: string | null
  scanLabel: string | null
}

export interface PromoNight extends NightView {
  design: AdDesign
}

export interface PromoBoard {
  venue: { id: string; name: string; city: string | null; timeZone: string }
  night: { name: string; format: string; themes: string[] }
  nights: PromoNight[]
  // Every booked act, in the order they said yes.
  acts: { name: string; imageUrl: string | null }[]
}
