import { API_URL } from "../config"
import { supabase } from "./supabase"
import type { CheckinBody, CheckinResult, DoorView, Venue } from "./types"

// The server refused (wrong night, unknown code, no access): show its message, never retry.
export class RefusedError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
  }
}

// No connection, or the server is down: the caller may keep the request and send it later.
export class OfflineError extends Error {}

// Every call carries the signed-in person's token; the server applies the same roles and rules as on the web.
async function call<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = (await supabase.auth.getSession()).data.session?.access_token
  let response: Response
  try {
    response = await fetch(`${API_URL}/api/v1${path}`, {
      method: init.method ?? "GET",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    })
  } catch {
    throw new OfflineError("No connection")
  }
  const json = (await response.json().catch(() => null)) as { data?: T; error?: { message?: string } } | null
  if (response.status >= 500) throw new OfflineError("The server did not answer")
  if (!response.ok) throw new RefusedError(response.status, json?.error?.message ?? "That did not go through.")
  return json?.data as T
}

export const api = {
  venues: () => call<Venue[]>("/venues"),
  door: (venueId: string) => call<DoorView | null>(`/venues/${venueId}/door`),
  checkIn: (nightId: string, body: CheckinBody) =>
    call<CheckinResult>(`/nights/${nightId}/checkins`, { method: "POST", body }),
}
