import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useEffect } from "react"
import { api } from "../lib/api"
import { supabase } from "../lib/supabase"

export const doorKey = (venueId: string) => ["door", venueId] as const

export const useVenues = () => useQuery({ queryKey: ["venues"], queryFn: api.venues, staleTime: 60_000 })

// Tonight's door for a venue, kept live: every arrival from any phone refreshes it. It listens, it never polls.
export function useDoor(venueId: string) {
  const queries = useQueryClient()
  const door = useQuery({ queryKey: doorKey(venueId), queryFn: () => api.door(venueId), staleTime: 15_000 })
  const nightId = door.data?.night.id

  useEffect(() => {
    if (!nightId) return
    let stop = () => {}
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) supabase.realtime.setAuth(data.session.access_token)
      const channel = supabase
        .channel(`door-${nightId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "checkins", filter: `event_night_id=eq.${nightId}` },
          () => queries.invalidateQueries({ queryKey: doorKey(venueId) }),
        )
        .subscribe()
      stop = () => {
        supabase.removeChannel(channel)
      }
    })
    return () => stop()
  }, [nightId, venueId, queries])

  return door
}
