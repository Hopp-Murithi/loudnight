"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { adminApi } from "../api"
import type { SuspendVenueInput } from "../admin.schemas"

// The console pages are server rendered, so each change refreshes the page it was made on.
function useAdminAction<T>(run: (input: T) => Promise<unknown>, done: string) {
  const router = useRouter()
  const queries = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      toast.success(done)
      queries.invalidateQueries({ queryKey: ["admin"] })
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}

export const useSuspendVenue = (venueId: string) =>
  useAdminAction((input: SuspendVenueInput) => adminApi.suspend(venueId, input), "Venue suspended")

export const useLiftVenue = (venueId: string) => useAdminAction(() => adminApi.lift(venueId), "Suspension lifted")

export const useSetPersonActive = (personId: string) =>
  useAdminAction(
    (active: boolean) => adminApi.setActive(personId, { active }),
    "Saved. It applies to every device at once.",
  )

// A row's details, fetched when its panel opens and kept briefly while the administrator moves between rows.
export const useAdminVenue = (venueId: string | null) =>
  useQuery({
    queryKey: ["admin", "venue", venueId],
    queryFn: () => adminApi.venue(venueId ?? ""),
    enabled: venueId !== null,
    staleTime: 30_000,
  })

export const useAdminPerson = (personId: string | null) =>
  useQuery({
    queryKey: ["admin", "person", personId],
    queryFn: () => adminApi.person(personId ?? ""),
    enabled: personId !== null,
    staleTime: 30_000,
  })
