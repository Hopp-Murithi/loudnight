import type { Enums } from "@/types/database"

export type Weekday = Enums<"weekday">
export type VenueType = Enums<"venue_type">
export type VenueCapability = Enums<"venue_capability">

export const WEEKDAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const satisfies readonly Weekday[]

export const WEEKDAY_LABELS: Record<Weekday, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

export const VENUE_TYPES = ["bar", "cafe", "restaurant", "music_venue", "other"] as const satisfies readonly VenueType[]

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  bar: "Bar",
  cafe: "Cafe",
  restaurant: "Restaurant",
  music_venue: "Music venue",
  other: "Other",
}

export const VENUE_CAPABILITIES = [
  "stage",
  "screen",
  "sound_system",
  "kitchen",
  "outdoor_space",
  "dance_floor",
] as const satisfies readonly VenueCapability[]

export const VENUE_CAPABILITY_LABELS: Record<VenueCapability, string> = {
  stage: "Stage",
  screen: "Screen",
  sound_system: "Sound system",
  kitchen: "Kitchen",
  outdoor_space: "Outdoor space",
  dance_floor: "Dance floor",
}

export const SEARCH_RADIUS_M = { default: 2000, min: 250, max: 10_000 } as const
