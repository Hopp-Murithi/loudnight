import { apiFetch } from "@/lib/http/client"
import type {
  DeleteVenueInput,
  PlaceOption,
  VenueIdentityInput,
  VenueOnboardingInput,
  VenueSettingsInput,
} from "./venues.schemas"

export const venuesApi = {
  create: (input: VenueOnboardingInput) => apiFetch<{ id: string }>("/venues", { method: "POST", body: input }),
  updateIdentity: (id: string, input: VenueIdentityInput) =>
    apiFetch<{ saved: true }>(`/venues/${id}`, { method: "PATCH", body: input }),
  updateSettings: (id: string, input: VenueSettingsInput) =>
    apiFetch<{ saved: true }>(`/venues/${id}/settings`, { method: "PATCH", body: input }),
  remove: (id: string, input: DeleteVenueInput) =>
    apiFetch<{ deleted: true }>(`/venues/${id}`, { method: "DELETE", body: input }),
  searchPlaces: (query: string) => apiFetch<PlaceOption[]>("/places/search", { method: "POST", body: { query } }),
}
