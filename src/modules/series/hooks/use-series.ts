"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { seriesApi } from "../api"
import type { NightEditInput } from "../series.schemas"

// The page is rendered on the server from stored rows, so a successful change just asks it to render again.
export function useCreateSeries() {
  const router = useRouter()
  return useMutation({
    mutationFn: (conceptId: string) => seriesApi.create(conceptId),
    onSuccess: () => {
      toast.success("Your four weeks are ready")
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}

export function useUpdateNight(nightId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: NightEditInput) => seriesApi.updateNight(nightId, input),
    onSuccess: () => {
      toast.success("Night saved")
      router.refresh()
    },
  })
}
