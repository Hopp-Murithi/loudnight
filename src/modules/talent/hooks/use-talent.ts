"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { plural } from "@/lib/format"
import { talentApi } from "../api"

export function useFindTalent(seriesId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: () => talentApi.find(seriesId),
    onSuccess: ({ found }) => {
      toast.success(found > 0 ? `${plural(found, "performer")} found` : "No close local matches this time")
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}

export function useEditOutreach(talentId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (message: string) => talentApi.editOutreach(talentId, message),
    onSuccess: () => {
      toast.success("Message saved")
      router.refresh()
    },
  })
}
