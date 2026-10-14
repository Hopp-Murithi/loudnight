"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { showApiError } from "@/components/forms/api-errors"
import { ROUTES } from "@/config/site"
import { previewApi } from "../api"

// Every cached answer belongs to whoever was reading, so the cache is cleared when the reader changes.
export function useStartPreview() {
  const router = useRouter()
  const queries = useQueryClient()
  return useMutation({
    mutationFn: previewApi.start,
    onSuccess: () => {
      queries.clear()
      router.push(ROUTES.venues)
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}

export function useEndPreview() {
  const router = useRouter()
  const queries = useQueryClient()
  return useMutation({
    mutationFn: previewApi.end,
    onSuccess: () => {
      queries.clear()
      router.push(ROUTES.adminPeople)
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}
