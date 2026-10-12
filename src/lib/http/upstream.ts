import "server-only"
import type { ZodType } from "zod"
import { upstreamFailed } from "./errors"

interface UpstreamRequest<T> {
  service: string
  url: string
  init?: RequestInit
  timeoutMs: number
  schema: ZodType<T>
}

// Calls a third-party API with a hard timeout and checks the shape of what comes back.
// Keys, URLs and upstream messages stay in the server log, never in the response to the browser.
export async function fetchUpstream<T>({ service, url, init, timeoutMs, schema }: UpstreamRequest<T>): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" })
  } catch (error) {
    console.error(`${service} request failed`, error instanceof Error ? error.name : error)
    throw upstreamFailed(service)
  }

  if (!response.ok) {
    console.error(`${service} answered ${response.status}`)
    throw upstreamFailed(service)
  }

  const parsed = schema.safeParse(await response.json().catch(() => null))
  if (!parsed.success) {
    console.error(`${service} answered in an unexpected shape`)
    throw upstreamFailed(service)
  }
  return parsed.data
}
