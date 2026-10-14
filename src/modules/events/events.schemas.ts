import { z } from "zod"
import type { Enums } from "@/types/database"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE = /^\+?[0-9][0-9 ()-]{6,19}$/

const optionalText = z
  .string()
  .trim()
  .max(120)
  .transform((value) => value || undefined)
  .optional()

// Two fields and a party size. A contact is optional; when given it must be an email or a phone number, and the guest
// agrees that the venue may use it about this night. `website` is a trap field people never see; bots fill it in.
export const rsvpSchema = z
  .object({
    name: z.string().trim().min(1, "Enter your name.").max(80, "Use 80 characters or fewer."),
    contact: optionalText.refine((value) => !value || EMAIL.test(value) || PHONE.test(value), {
      message: "Enter an email address or a phone number.",
    }),
    partySize: z
      .number({ error: "Enter how many of you are coming." })
      .int("Use a whole number.")
      .min(1, "At least 1.")
      .max(10, "Up to 10. For a bigger group, call the venue."),
    consent: z.boolean().default(false),
    website: z.string().max(200).optional(),
  })
  .refine((input) => !input.contact || input.consent, {
    message: "Tick the box so the venue may contact you about this night.",
    path: ["consent"],
  })

export type RsvpInput = z.input<typeof rsvpSchema>
export type RsvpValues = z.output<typeof rsvpSchema>

export const NIGHT_ACTIONS = ["publish", "unpublish", "cancel"] as const
export type NightAction = (typeof NIGHT_ACTIONS)[number]
export const nightActionSchema = z.object({ action: z.enum(NIGHT_ACTIONS) })

// Everything a guest's event page shows. Nothing here is private to the venue.
export interface EventPageView {
  nightId: string
  venueId: string
  slug: string
  sequence: number
  title: string
  blurb: string | null
  twist: string
  lineup: string[]
  startsAt: string
  status: Extract<Enums<"night_status">, "published" | "cancelled">
  past: boolean
  nextSlug: string | null
  // The venue is suspended by Loudnight: its page stays up, but it takes no bookings or check-ins.
  paused: boolean
  venue: { name: string; address: string; town: string; timeZone: string; latitude: number; longitude: number }
}
