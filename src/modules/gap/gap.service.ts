import "server-only"
import { COMPETING_PRIMARY_TYPES } from "@/config/gap"
import type { LatLng } from "@/lib/geo"
import { placeDetails, placesNearby } from "@/lib/places/client"
import { eventsNear } from "@/lib/ticketmaster/client"
import { atStep, withStep, type StepContext } from "@/modules/runs/runs.steps"
import { toNearbyEvents, toNearbyVenues, toScout } from "./gap.mapping"
import type { CoveredTheme, GapScan, NearbyEvent, NearbyVenue, Scout } from "./gap.schemas"
import { coveredThemes } from "./gap.themes"
import { nextEvenings, ticketmasterTime, type Weekday } from "./gap.weekdays"

export interface GapVenue {
  placeId: string | null
  point: LatLng
  radiusMetres: number
  timeZone: string
  weekday: Weekday
}

const settle = async <T>(call: () => Promise<T>): Promise<{ ok: true; value: T } | { ok: false }> => {
  try {
    return { ok: true, value: await call() }
  } catch {
    return { ok: false }
  }
}

// Pipeline step 1. A venue without a Places id (or a Places outage) still plans; the trace shows why.
export async function scoutVenue(placeId: string | null, trace?: StepContext): Promise<Scout | null> {
  if (!placeId) return null
  const step = atStep(trace, "scout")
  const result = await settle(() =>
    withStep(
      step,
      "places.details",
      { placeId },
      () => placeDetails(placeId),
      (details) => ({
        summary: { name: details.displayName?.text ?? null, rating: details.rating ?? null },
      }),
    ),
  )
  return result.ok ? toScout(result.value) : null
}

function nearbyVenues(venue: GapVenue, trace?: StepContext): Promise<NearbyVenue[]> {
  const input = { radiusMetres: venue.radiusMetres, types: [...COMPETING_PRIMARY_TYPES] }
  return withStep(
    trace,
    "places.nearby",
    input,
    async () =>
      toNearbyVenues(
        await placesNearby(venue.point, venue.radiusMetres, COMPETING_PRIMARY_TYPES),
        venue.placeId,
        venue.point,
      ),
    (venues) => ({ summary: { count: venues.length } }),
  )
}

function eventsOnNights(venue: GapVenue, nights: ReturnType<typeof nextEvenings>, trace?: StepContext) {
  const radiusKm = Math.max(1, venue.radiusMetres / 1000)
  return withStep(
    trace,
    "ticketmaster.events",
    { weekday: venue.weekday, nights: nights.map((night) => night.localDate), radiusKm },
    async () => {
      const perNight = await Promise.all(
        nights.map((night) =>
          eventsNear({
            ...venue.point,
            radiusKm,
            startDateTime: ticketmasterTime(night.start),
            endDateTime: ticketmasterTime(night.end),
          }),
        ),
      )
      return toNearbyEvents(
        perNight.flat(),
        nights.map((night) => night.localDate),
      )
    },
    (events) => ({ summary: { count: events.length } }),
  )
}

function themesFor(venue: GapVenue, venues: NearbyVenue[], events: NearbyEvent[], trace?: StepContext) {
  return withStep(
    trace,
    "planner.themes",
    { venues: venues.length, events: events.length },
    () => coveredThemes(venue.weekday, venues, events),
    (themes: CoveredTheme[]) => ({ summary: { themes: themes.map((theme) => theme.theme) } }),
  )
}

// Pipeline step 3: what is already on nearby on the target night. A missing source is reported, never hidden.
export async function findGap(venue: GapVenue, trace?: StepContext, now: Date = new Date()): Promise<GapScan> {
  const step = atStep(trace, "find_gap")
  const nights = nextEvenings(venue.weekday, venue.timeZone, now)
  const [places, events] = await Promise.all([
    settle(() => nearbyVenues(venue, step)),
    settle(() => eventsOnNights(venue, nights, step)),
  ])
  const venues = places.ok ? places.value : []
  const nightEvents = events.ok ? events.value : []
  const bothFailed = !places.ok && !events.ok
  const themes = bothFailed ? { ok: false as const } : await settle(() => themesFor(venue, venues, nightEvents, step))

  return {
    weekday: venue.weekday,
    nights: nights.map((night) => night.localDate),
    venues,
    events: nightEvents,
    themes: themes.ok ? themes.value : [],
    sources: {
      places: places.ok ? "ok" : "failed",
      events: events.ok ? "ok" : "failed",
      themes: themes.ok ? "ok" : "failed",
    },
    noveltyNeutral: bothFailed,
  }
}
