"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { conceptsApi } from "../api"

export function useChooseConcept() {
  const router = useRouter()
  return useMutation({
    mutationFn: (conceptId: string) => conceptsApi.choose(conceptId),
    onSuccess: () => {
      toast.success("Night chosen")
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}
