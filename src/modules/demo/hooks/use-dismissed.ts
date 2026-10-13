"use client"

import { useCallback, useSyncExternalStore } from "react"

const listeners = new Set<() => void>()
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key) === "1"
  } catch {
    return false
  }
}

// Remembers a dismissed hint in this browser. A convenience only: nothing depends on it.
export function useDismissed(key: string) {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false,
  )
  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(key, "1")
    } catch {
      return
    } finally {
      listeners.forEach((listener) => listener())
    }
  }, [key])
  return { dismissed, dismiss }
}
