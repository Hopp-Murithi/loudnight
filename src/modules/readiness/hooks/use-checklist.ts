"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { showApiError } from "@/components/forms/api-errors"
import type { LogisticsId } from "@/config/readiness"
import { readinessApi } from "../api"

// Ticks show at once and are saved behind them. If a save fails, the tick goes back to what the server has.
export function useChecklist(nightId: string | null, initial: LogisticsId[]) {
  const router = useRouter()
  const [done, setDone] = useState(initial)
  const save = useMutation({
    mutationFn: (next: LogisticsId[]) => readinessApi.saveChecklist(nightId ?? "", { done: next }),
    onSuccess: () => router.refresh(),
    onError: (error) => {
      setDone(initial)
      showApiError(error)
    },
  })

  const toggle = (id: LogisticsId) => {
    if (!nightId) return
    const next = done.includes(id) ? done.filter((item) => item !== id) : [...done, id]
    setDone(next)
    save.mutate(next)
  }

  return { done, toggle }
}
