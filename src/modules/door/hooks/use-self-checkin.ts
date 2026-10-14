"use client"

import { useMutation } from "@tanstack/react-query"
import { useSyncExternalStore } from "react"
import { doorApi } from "../api"

// A guest is counted once per night on this device; asking again shows the welcome instead of counting twice.
const key = (slug: string) => `encore:here:${slug}`
const remembered = (slug: string) => {
  try {
    return window.localStorage.getItem(key(slug)) !== null
  } catch {
    return false
  }
}

export function useSelfCheckIn(slug: string) {
  const already = useSyncExternalStore(
    () => () => {},
    () => remembered(slug),
    () => false,
  )
  const here = useMutation({
    mutationFn: (partySize: number) => doorApi.selfCheckIn(slug, partySize),
    onSuccess: () => {
      try {
        window.localStorage.setItem(key(slug), new Date().toISOString())
      } catch {
        // Not remembered on this device; the count is still right.
      }
    },
  })
  return { here, done: already || here.isSuccess }
}
