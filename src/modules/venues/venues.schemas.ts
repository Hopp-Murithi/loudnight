import { z } from "zod"
import type { VenueRole } from "@/config/navigation"
import { TIME_ZONES, type TimeZone } from "@/config/time-zones"
import {
  VENUE_CAPABILITIES,
  VENUE_TYPES,
  WEEKDAYS,
  type VenueCapability,
  type VenueType,
  type Weekday,
} from "@/config/venues"

const timeZoneValues = TIME_ZONES.map((zone) => zone.value) as [TimeZone, ...TimeZone[]]

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .number({ error: `Enter ${label}.` })
    .int(`Use a whole number for ${label}.`)
    .min(min, `Use at least ${min}.`)
    .max(max, `Use ${max.toLocaleString("en-US")} or less.`)

const dollars = (label: string, max: number) =>
  z
    .number({ error: `Enter ${label}.` })
    .min(0, "Use 0 or more.")
    .max(max, `Use ${max.toLocaleString("en-US")} or less.`)

export const venueIdentitySchema = z.object({
  name: z.string().trim().min(1, "Enter the venue's name.").max(120),
  address: z.string().trim().min(1, "Choose the venue's address.").max(300),
  // Every venue comes from the address search: the planner needs its Google place to scout it.
  googlePlaceId: z.string().min(1, "Choose your venue from the search results.").max(300),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  venueType: z.enum(VENUE_TYPES),
  timeZone: z.enum(timeZoneValues),
})

export const venueSettingsSchema = z.object({
  slowNight: z.enum(WEEKDAYS, { error: "Choose your quiet night." }),
  breakEvenHeadcount: wholeNumber("how many people you need", 1, 100_000),
  capacity: wholeNumber("how many people the room holds", 1, 100_000),
  capabilities: z.array(z.enum(VENUE_CAPABILITIES)).max(VENUE_CAPABILITIES.length),
  talentBudgetDollars: dollars("a talent budget", 1_000_000),
  averageSpendDollars: dollars("what a guest spends", 100_000),
})

export const venueOnboardingSchema = venueIdentitySchema.extend(venueSettingsSchema.shape)

export const deleteVenueSchema = z.object({ confirmName: z.string().trim().min(1, "Type the venue's name.") })

export const placeSearchSchema = z.object({ query: z.string().trim().min(3, "Type at least 3 characters.").max(200) })

export type VenueIdentityInput = z.infer<typeof venueIdentitySchema>
export type VenueSettingsInput = z.infer<typeof venueSettingsSchema>
export type VenueOnboardingInput = z.infer<typeof venueOnboardingSchema>
export type DeleteVenueInput = z.infer<typeof deleteVenueSchema>
export type PlaceSearchInput = z.infer<typeof placeSearchSchema>

export interface PlaceOption {
  googlePlaceId: string
  name: string
  address: string
  latitude: number
  longitude: number
  venueType: VenueType
  timeZone: TimeZone
}

export interface MyVenue {
  id: string
  name: string
  address: string
  venueType: VenueType
  role: VenueRole
}

export interface VenueSettingsView {
  slowNight: Weekday
  breakEvenHeadcount: number
  capacity: number
  capabilities: VenueCapability[]
  talentBudgetDollars: number
  averageSpendDollars: number
}

export interface VenueDetail extends MyVenue {
  googlePlaceId: string | null
  latitude: number
  longitude: number
  timeZone: string
  // Null for door staff: money and settings are for owners and managers (RLS).
  settings: VenueSettingsView | null
}

export interface DemoVenue {
  id: string
  name: string
  address: string
  venueType: VenueType
  planReady: boolean
}

export const toCents = (dollarsValue: number) => Math.round(dollarsValue * 100)
export const toDollars = (cents: number) => cents / 100
