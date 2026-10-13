"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { venuesApi } from "../api"

const DEBOUNCE_MS = 350
const MIN_LENGTH = 3

// Waits for the person to stop typing before asking, so each search costs one Places call.
export function usePlaceSearch(text: string) {
  const [query, setQuery] = useState(text)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(text.trim()), DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [text])

  return useQuery({
    queryKey: ["places", query],
    queryFn: () => venuesApi.searchPlaces(query),
    enabled: query.length >= MIN_LENGTH,
    staleTime: 5 * 60_000,
    retry: false,
  })
}
