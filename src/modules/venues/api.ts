import { apiFetch } from "@/lib/http/client"
import type {
  DeleteVenueInput,
  PlaceOption,
  PlacePickInput,
  PlaceSearchInput,
  PlaceSuggestions,
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
  searchPlaces: (input: PlaceSearchInput) =>
    apiFetch<PlaceSuggestions>("/places/search", { method: "POST", body: input }),
  pickPlace: (input: PlacePickInput) => apiFetch<PlaceOption>("/places/pick", { method: "POST", body: input }),
}
