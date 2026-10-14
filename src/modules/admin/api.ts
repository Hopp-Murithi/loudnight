import { apiFetch } from "@/lib/http/client"
import type { PersonStatusInput, SuspendVenueInput } from "./admin.schemas"

export const adminApi = {
  suspend: (venueId: string, input: SuspendVenueInput) =>
    apiFetch<{ suspended: boolean }>(`/admin/venues/${venueId}/suspension`, { method: "POST", body: input }),
  lift: (venueId: string) =>
    apiFetch<{ suspended: boolean }>(`/admin/venues/${venueId}/suspension`, { method: "DELETE" }),
  setActive: (personId: string, input: PersonStatusInput) =>
    apiFetch<{ active: boolean }>(`/admin/people/${personId}`, { method: "PATCH", body: input }),
}
