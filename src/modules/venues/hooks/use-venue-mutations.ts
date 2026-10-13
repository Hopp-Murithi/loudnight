"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ROUTES } from "@/config/site"
import { venuesApi } from "../api"
import type { DeleteVenueInput, VenueIdentityInput, VenueOnboardingInput, VenueSettingsInput } from "../venues.schemas"

export function useCreateVenue() {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: VenueOnboardingInput) => venuesApi.create(input),
    onSuccess: ({ id }) => {
      toast.success("Venue saved")
      router.push(ROUTES.venue(id))
      router.refresh()
    },
  })
}

export function useUpdateVenueIdentity(venueId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: VenueIdentityInput) => venuesApi.updateIdentity(venueId, input),
    onSuccess: () => {
      toast.success("Venue details saved")
      router.refresh()
    },
  })
}

export function useUpdateVenueSettings(venueId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: VenueSettingsInput) => venuesApi.updateSettings(venueId, input),
    onSuccess: () => {
      toast.success("Settings saved")
      router.refresh()
    },
  })
}

export function useDeleteVenue(venueId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: DeleteVenueInput) => venuesApi.remove(venueId, input),
    onSuccess: () => {
      toast.success("Venue deleted")
      router.replace(ROUTES.venues)
      router.refresh()
    },
  })
}
