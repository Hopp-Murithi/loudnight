"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { showApiError } from "@/components/forms/api-errors"
import { ROUTES } from "@/config/site"
import type { Weekday } from "@/config/venues"
import { conceptsApi } from "@/modules/concepts/api"
import type { ConceptView } from "@/modules/concepts/concepts.schemas"
import { runsApi } from "../api"

export function useStartRun(venueId: string, weekday: Weekday) {
  const router = useRouter()
  return useMutation({
    mutationFn: () => runsApi.start(venueId, weekday),
    onSuccess: ({ encoreId }) => router.push(ROUTES.venueRun(venueId, encoreId)),
    onError: (error) => showApiError(error),
  })
}

// Made once and stored; a viewer who may not plan only ever sees what is already there.
export function useGenericAnswer(runId: string, stored: string | null, canRun: boolean) {
  return useQuery({
    queryKey: ["generic", runId],
    queryFn: async () => (await runsApi.generic(runId)).answer,
    initialData: stored ?? undefined,
    enabled: canRun && stored === null,
    staleTime: Infinity,
    retry: 1,
  })
}

export function useShortlist(runId: string, initial: ConceptView[], ready: boolean) {
  return useQuery({
    queryKey: ["shortlist", runId],
    queryFn: () => conceptsApi.shortlist(runId),
    initialData: initial.length > 0 ? initial : undefined,
    enabled: ready,
    staleTime: 60_000,
  })
}
