"use client"

import { useSyncExternalStore } from "react"

// A guest's tickets are remembered on their own device only, so the event page can say "Your ticket" next time.
// Storage can be missing or blocked (private windows); then the page simply does not offer it.
const KEY = "encore:tickets"

function read(): Record<string, string> {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(KEY) ?? "{}")
    return value && typeof value === "object" ? (value as Record<string, string>) : {}
  } catch {
    return {}
  }
}

export function rememberTicket(slug: string, code: string) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ ...read(), [slug]: code }))
  } catch {
    // Not remembered; the ticket's own link still works.
  }
}

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange)
  return () => window.removeEventListener("storage", onChange)
}

export function useSavedTicket(slug: string): string | null {
  return useSyncExternalStore(
    subscribe,
    () => read()[slug] ?? null,
    () => null,
  )
}
