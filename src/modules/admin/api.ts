import { apiFetch } from "@/lib/http/client"
import type { AdminPersonDetail, AdminVenueDetail, PersonStatusInput, SuspendVenueInput } from "./admin.schemas"

export const adminApi = {
  venue: (venueId: string) => apiFetch<AdminVenueDetail>(`/admin/venues/${venueId}`),
  person: (personId: string) => apiFetch<AdminPersonDetail>(`/admin/people/${personId}`),
  suspend: (venueId: string, input: SuspendVenueInput) =>
    apiFetch<{ suspended: boolean }>(`/admin/venues/${venueId}/suspension`, { method: "POST", body: input }),
  lift: (venueId: string) =>
    apiFetch<{ suspended: boolean }>(`/admin/venues/${venueId}/suspension`, { method: "DELETE" }),
  setActive: (personId: string, input: PersonStatusInput) =>
    apiFetch<{ active: boolean }>(`/admin/people/${personId}`, { method: "PATCH", body: input }),
}
