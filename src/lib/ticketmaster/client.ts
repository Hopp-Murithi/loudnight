import "server-only"
import { z } from "zod"
import { TICKETMASTER } from "@/config/integrations"
import { ticketmasterEnv } from "@/lib/env/server"
import { fetchUpstream } from "@/lib/http/upstream"

const eventSchema = z.object({
  id: z.string(),
  name: z.string(),
  dates: z
    .object({ start: z.object({ localDate: z.string().optional(), localTime: z.string().optional() }) })
    .optional(),
  classifications: z
    .array(
      z.object({
        segment: z.object({ name: z.string() }).optional(),
        genre: z.object({ name: z.string() }).optional(),
      }),
    )
    .optional(),
})

const eventsSchema = z.object({ _embedded: z.object({ events: z.array(eventSchema) }).optional() })

export type TicketmasterEvent = z.infer<typeof eventSchema>

interface EventsNearQuery {
  latitude: number
  longitude: number
  radiusKm: number
  startDateTime: string
  endDateTime: string
}

// Events near the venue in a time window. Ticketmaster wants UTC times without milliseconds.
export async function eventsNear(query: EventsNearQuery): Promise<TicketmasterEvent[]> {
  const params = new URLSearchParams({
    apikey: ticketmasterEnv().TICKETMASTER_API_KEY,
    latlong: `${query.latitude},${query.longitude}`,
    radius: String(Math.max(1, Math.round(query.radiusKm))),
    unit: "km",
    startDateTime: query.startDateTime,
    endDateTime: query.endDateTime,
    size: "50",
  })
  const body = await fetchUpstream({
    service: "Ticketmaster",
    url: `${TICKETMASTER.url}/events.json?${params}`,
    timeoutMs: TICKETMASTER.timeoutMs,
    schema: eventsSchema,
  })
  return body._embedded?.events ?? []
}
