"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { eventsApi } from "../api"
import type { NightAction } from "../events.schemas"

const DONE: Record<NightAction, string> = {
  publish: "Published. The event page is live.",
  unpublish: "Back to draft. The event page is no longer public.",
  cancel: "Cancelled. Guests who open the page see a notice.",
}

export function useNightAction(nightId: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (action: NightAction) => eventsApi.changeNight(nightId, action),
    onSuccess: (_result, action) => {
      toast.success(DONE[action])
      router.refresh()
    },
    onError: (error) => showApiError(error),
  })
}
