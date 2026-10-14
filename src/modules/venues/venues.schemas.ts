import { z } from "zod"
import type { VenueRole } from "@/config/navigation"
import { isCountryCode } from "@/config/countries"
import { isCurrency } from "@/config/currencies"
import { isTimeZone } from "@/config/time-zones"
import {
  ATMOSPHERES,
  QUIET_NIGHTS_MAX,
  VENUE_CAPABILITIES,
  VENUE_HOSTS,
  VENUE_TYPES,
  WEEKDAYS,
  type Atmosphere,
  type VenueCapability,
  type VenueHost,
  type VenueType,
  type Weekday,
} from "@/config/venues"

const wholeNumber = (label: string, min: number, max: number) =>
  z
    .number({ error: `Enter ${label}.` })
    .int(`Use a whole number for ${label}.`)
    .min(min, `Use at least ${min}.`)
    .max(max, `Use ${max.toLocaleString("en-US")} or less.`)

const amount = (label: string, max: number) =>
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
  timeZone: z.string().refine(isTimeZone, "Choose a time zone."),
  // From the venue's Google place. Venues made before Loudnight worked worldwide have no stored town or country.
  countryCode: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  city: z.string().trim().min(1).max(120).nullable(),
  currency: z.string().refine(isCurrency, "Choose a currency."),
})

export const venueSettingsSchema = z.object({
  quietNights: z
    .array(z.enum(WEEKDAYS))
    .min(1, "Choose your quiet night.")
    .max(QUIET_NIGHTS_MAX, `Choose up to ${QUIET_NIGHTS_MAX} nights.`)
    .refine((nights) => new Set(nights).size === nights.length, "Choose each night once."),
  breakEvenHeadcount: wholeNumber("how many people you need", 1, 100_000),
  capacity: wholeNumber("how many people the room holds", 1, 100_000),
  capabilities: z.array(z.enum(VENUE_CAPABILITIES)).max(VENUE_CAPABILITIES.length),
  hosts: z.array(z.enum(VENUE_HOSTS)).max(VENUE_HOSTS.length),
  atmosphere: z.enum(ATMOSPHERES),
  talentBudget: amount("a talent budget", 20_000_000),
  averageSpend: amount("what a guest spends", 10_000_000),
})

export const venueOnboardingSchema = venueIdentitySchema.extend(venueSettingsSchema.shape)

export const deleteVenueSchema = z.object({ confirmName: z.string().trim().min(1, "Type the venue's name.") })

const country = z.string().refine(isCountryCode, "Choose a country.")
const session = z.uuid()

export const placeSearchSchema = z.object({
  query: z.string().trim().min(3, "Type at least 3 characters.").max(200),
  country,
  session,
})

export const placePickSchema = z.object({ placeId: z.string().min(1).max(300), session })

export type VenueIdentityInput = z.infer<typeof venueIdentitySchema>
export type VenueSettingsInput = z.infer<typeof venueSettingsSchema>
export type VenueOnboardingInput = z.infer<typeof venueOnboardingSchema>
export type DeleteVenueInput = z.infer<typeof deleteVenueSchema>
export type PlaceSearchInput = z.infer<typeof placeSearchSchema>
export type PlacePickInput = z.infer<typeof placePickSchema>

// One suggestion while the owner types: enough to recognise the place, not yet its details.
export interface PlaceSuggestion {
  placeId: string
  name: string
  detail: string
  kind: string | null
}

export interface PlaceSuggestions {
  places: PlaceSuggestion[]
  // True when no bar, club, restaurant, cafe or pub matched and every kind of place is shown instead.
  broadened: boolean
}

export interface PlaceOption {
  googlePlaceId: string
  name: string
  address: string
  latitude: number
  longitude: number
  venueType: VenueType
  timeZone: string
  countryCode: string | null
  city: string | null
  currency: string
}

export interface MyVenue {
  id: string
  name: string
  address: string
  city: string | null
  venueType: VenueType
  role: VenueRole
}

export interface VenueSettingsView {
  // The first quiet night, kept for every screen that speaks of one night.
  slowNight: Weekday
  quietNights: Weekday[]
  breakEvenHeadcount: number
  capacity: number
  capabilities: VenueCapability[]
  hosts: VenueHost[]
  atmosphere: Atmosphere
  talentBudget: number
  averageSpend: number
  searchRadiusM: number
}

export interface VenueDetail extends MyVenue {
  googlePlaceId: string | null
  latitude: number
  longitude: number
  timeZone: string
  countryCode: string | null
  currency: string
  // Set while Loudnight has suspended the venue: the team still reads it, but nothing changes.
  suspension: { at: string; reason: string } | null
  // Null for door staff: money and settings are for owners and managers (RLS).
  settings: VenueSettingsView | null
}

export interface DemoVenue {
  id: string
  name: string
  address: string
  city: string | null
  venueType: VenueType
  planReady: boolean
}

// Amounts are kept as hundredths of the venue's currency, whichever currency that is.
export const toCents = (value: number) => Math.round(value * 100)
export const fromCents = (cents: number) => cents / 100
