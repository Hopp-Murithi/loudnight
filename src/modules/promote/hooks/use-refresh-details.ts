"use client"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useTransition } from "react"
import { toast } from "sonner"

// Reads the night again from the server and says so when it is done, even when nothing had changed.
export function useRefreshDetails(onStart: () => void) {
  const router = useRouter()
  const [refreshing, startRefresh] = useTransition()
  const asked = useRef(false)

  useEffect(() => {
    if (refreshing || !asked.current) return
    asked.current = false
    toast.success("Up to date with your night")
  }, [refreshing])

  const refresh = useCallback(() => {
    asked.current = true
    onStart()
    startRefresh(() => router.refresh())
  }, [onStart, router])

  return { refreshing, refresh }
}
