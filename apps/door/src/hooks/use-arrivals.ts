import { useQueryClient } from "@tanstack/react-query"
import * as Crypto from "expo-crypto"
import { useCallback, useEffect, useState } from "react"
import { AppState } from "react-native"
import { SYNC_EVERY_MS } from "../config"
import { api, OfflineError, RefusedError } from "../lib/api"
import { enqueue, flush, type Outcome } from "../lib/queue"
import { queueStore } from "../lib/storage"
import type { CheckinBody, CheckinResult } from "../lib/types"
import { doorKey } from "./use-door"

// What the door shows after one scan, tap or walk-in.
export type Arrival =
  | { kind: "in"; result: CheckinResult }
  | { kind: "already"; result: CheckinResult }
  | { kind: "refused"; message: string }
  | { kind: "saved" }

// Checks guests in, straight away when online and from the waiting list when not. The server decides every result.
export function useArrivals(venueId: string, nightId: string | undefined) {
  const queries = useQueryClient()
  const [waiting, setWaiting] = useState(0)

  const sync = useCallback(async () => {
    const result = await flush(queueStore, async (item): Promise<Outcome> => {
      try {
        await api.checkIn(item.nightId, item.body)
        return "sent"
      } catch (error) {
        return error instanceof OfflineError ? "offline" : "refused"
      }
    })
    setWaiting(result.left)
    if (result.sent > 0) queries.invalidateQueries({ queryKey: doorKey(venueId) })
  }, [queries, venueId])

  useEffect(() => {
    sync()
    const timer = setInterval(sync, SYNC_EVERY_MS)
    const listener = AppState.addEventListener("change", (state) => state === "active" && sync())
    return () => {
      clearInterval(timer)
      listener.remove()
    }
  }, [sync])

  const send = useCallback(
    async (body: CheckinBody): Promise<Arrival> => {
      if (!nightId) return { kind: "refused", message: "No night is on yet." }
      try {
        const result = await api.checkIn(nightId, body)
        queries.invalidateQueries({ queryKey: doorKey(venueId) })
        return { kind: result.status, result }
      } catch (error) {
        if (error instanceof RefusedError) return { kind: "refused", message: error.message }
        const key = "clientKey" in body ? body.clientKey : Crypto.randomUUID()
        setWaiting(await enqueue(queueStore, { key, nightId, body, at: new Date().toISOString() }))
        return { kind: "saved" }
      }
    },
    [nightId, queries, venueId],
  )

  const walkIn = useCallback(
    (partySize: number) => send({ walkIn: true, partySize, clientKey: Crypto.randomUUID() }),
    [send],
  )

  return { send, walkIn, waiting, sync }
}
