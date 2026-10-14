"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { plural } from "@/lib/format"
import type { TalentEditInput } from "@/modules/series/series.schemas"
import { talentApi } from "../api"

export function useFindTalent(seriesId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: () => talentApi.find(seriesId),
    onSuccess: ({ found }) => {
      toast.success(found > 0 ? `${plural(found, "new performer")} to look at` : "No new close matches this time")
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}

const SAVED = {
  message: "Message saved",
  booked: "Booked. Your ads on Promote now name them.",
  free: "No longer booked. Your ads no longer name them.",
}

export function useUpdateTalent(talentId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: TalentEditInput) => talentApi.update(talentId, input),
    onSuccess: (_saved, input) => {
      toast.success("message" in input ? SAVED.message : input.booked ? SAVED.booked : SAVED.free)
      router.refresh()
    },
  })
}
