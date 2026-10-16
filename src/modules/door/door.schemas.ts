import { z } from "zod"
import type { NightNumbers } from "./door.metrics"

const partySize = z
  .number({ error: "Enter how many." })
  .int("Use a whole number.")
  .min(1, "At least 1.")
  .max(10, "Up to 10 at a time.")

// One arrival at the door: a scanned or typed ticket, a guest picked from the list, or people with no RSVP.
export const checkinSchema = z.union([
  z.object({ code: z.string().trim().min(1).max(300) }),
  z.object({ rsvpId: z.uuid() }),
  // The door app sends a key with each walk-in, so one synced twice after being offline is counted once.
  z.object({ walkIn: z.literal(true), partySize, clientKey: z.uuid().optional() }),
])
export type CheckinInput = z.infer<typeof checkinSchema>

// What the night took, in whole units of the venue's currency, as the owner tells it.
export const spendSchema = z.object({
  amount: z.number({ error: "Enter what the night took." }).min(0, "Use 0 or more.").max(20_000_000),
})
export type SpendInput = z.infer<typeof spendSchema>

export interface CheckinResult {
  status: "in" | "already"
  name: string
  partySize: number
  at: string
}

export interface DoorGuest {
  id: string
  name: string
  partySize: number
  arrivedAt: string | null
}

export interface DoorArrival {
  id: string
  name: string | null
  partySize: number
  at: string
}

// Everything the door screen shows for one night. Money is null for door staff.
export interface DoorView {
  night: { id: string; slug: string; title: string; startsAt: string; status: string; timeZone: string }
  // Null for door staff, who do not see the venue's settings.
  breakEven: number | null
  guests: DoorGuest[]
  recent: DoorArrival[]
  numbers: Omit<NightNumbers, "takingsCents" | "takingsLogged">
  money: { takingsCents: number; takingsLogged: boolean; currency: string } | null
}
