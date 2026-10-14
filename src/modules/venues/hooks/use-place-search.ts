"use client"

import { useMutation, useQuery } from "@tanstack/react-query"
import { useCallback, useEffect, useState } from "react"
import { showApiError } from "@/components/forms/api-errors"
import { venuesApi } from "../api"
import type { PlaceOption } from "../venues.schemas"

const DEBOUNCE_MS = 300
const MIN_LENGTH = 3

const newSession = () => crypto.randomUUID()

// Searches one country as the owner types, waiting for a pause so each word costs one call. The typing and the
// pick share a session token, which Google bills as a single search; a pick starts a fresh session.
export function usePlaceSearch(text: string, country: string, onPicked: (place: PlaceOption) => void) {
  const [query, setQuery] = useState(text)
  const [session, setSession] = useState(newSession)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text])

  const search = useQuery({
    queryKey: ["places", country, query],
    queryFn: () => venuesApi.searchPlaces({ query, country, session }),
    enabled: query.length >= MIN_LENGTH,
    staleTime: 5 * 60_000,
    retry: false,
  })

  const pick = useMutation({
    mutationFn: (placeId: string) => venuesApi.pickPlace({ placeId, session }),
    onSuccess: (place) => {
      setSession(newSession())
      onPicked(place)
    },
    onError: (error) => showApiError(error),
  })

  const choose = useCallback((placeId: string) => pick.mutate(placeId), [pick])

  return { search, choose, picking: pick.isPending ? pick.variables : null }
}
