"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { adminApi } from "../api"
import type { SuspendVenueInput } from "../admin.schemas"

// The console pages are server rendered, so each change refreshes the page it was made on.
function useAdminAction<T>(run: (input: T) => Promise<unknown>, done: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      toast.success(done)
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
