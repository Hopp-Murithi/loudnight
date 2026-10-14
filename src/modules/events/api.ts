import { apiFetch } from "@/lib/http/client"
import type { NightAction, RsvpValues } from "./events.schemas"

export const eventsApi = {
  rsvp: (slug: string, input: RsvpValues) =>
    apiFetch<{ code: string }>(`/e/${slug}/rsvp`, { method: "POST", body: input }),
  changeNight: (nightId: string, action: NightAction) =>
    apiFetch<{ status: string }>(`/nights/${nightId}/status`, { method: "POST", body: { action } }),
}
