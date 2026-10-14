"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { doorApi } from "../api"

export function useLogSpend(nightId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (amount: number) => doorApi.logSpend(nightId, amount),
    onSuccess: () => {
      toast.success("Takings saved")
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}
