"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { RealtimeChannel } from "@supabase/supabase-js"
import { useEffect } from "react"
import { createBrowserSupabase } from "@/lib/supabase/browser"
import { doorApi } from "../api"
import type { CheckinInput, DoorView } from "../door.schemas"

const doorKey = (nightId: string) => ["door", nightId] as const

// The night at the door, kept live: every RSVP and check-in for this night, from any phone, refreshes the counts.
// Realtime pushes the change; nothing polls. The channel is removed when the screen closes.
export function useDoor(initial: DoorView) {
  const nightId = initial.night.id
  const queryClient = useQueryClient()
  const door = useQuery({
    queryKey: doorKey(nightId),
    queryFn: () => doorApi.read(nightId),
    initialData: initial,
    staleTime: 30_000,
  })

  useEffect(() => {
    const supabase = createBrowserSupabase()
    const refresh = () => void queryClient.invalidateQueries({ queryKey: doorKey(nightId) })
    const filter = `event_night_id=eq.${nightId}`
    let channel: RealtimeChannel | null = null
    let closed = false
    // Realtime applies the same rules as the database, so it must know who is watching before it subscribes.
    void supabase.auth.getSession().then(async ({ data }) => {
      if (closed) return
      await supabase.realtime.setAuth(data.session?.access_token ?? null)
      channel = supabase
        .channel(`door-${nightId}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "checkins", filter }, refresh)
        .on("postgres_changes", { event: "*", schema: "public", table: "rsvps", filter }, refresh)
        .subscribe()
    })
    return () => {
      closed = true
      if (channel) void supabase.removeChannel(channel)
    }
  }, [nightId, queryClient])

  return door.data
}

export function useCheckIn(nightId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CheckinInput) => doorApi.checkIn(nightId, input),
    onSettled: () => queryClient.invalidateQueries({ queryKey: doorKey(nightId) }),
  })
}
