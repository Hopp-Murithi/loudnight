"use client"

import { useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ROUTES } from "@/config/site"
import { eventsApi } from "../api"
import type { RsvpValues } from "../events.schemas"
import { rememberTicket } from "./use-saved-ticket"

// A place on the list, then straight to the ticket.
export function useRsvp(slug: string) {
  const router = useRouter()
  return useMutation({
    mutationFn: (input: RsvpValues) => eventsApi.rsvp(slug, input),
    onSuccess: ({ code }) => {
      rememberTicket(slug, code)
      router.push(ROUTES.ticket(slug, code))
    },
  })
}
