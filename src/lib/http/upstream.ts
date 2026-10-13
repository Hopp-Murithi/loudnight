import "server-only"
import type { ZodType } from "zod"
import { upstreamFailed } from "./errors"

const RETRY_AFTER_CAP_MS = 5_000
const DEFAULT_RETRY_MS = 1_000

interface UpstreamRequest<T> {
  service: string
  url: string
  init?: RequestInit
  timeoutMs: number
  schema: ZodType<T>
  retryOnRateLimit?: boolean
  emptyOn?: { status: number; value: T }
}

export function retryDelayMs(header: string | null): number {
  const seconds = Number(header)
  if (!header || !Number.isFinite(seconds) || seconds < 0) return DEFAULT_RETRY_MS
  return Math.min(seconds * 1000, RETRY_AFTER_CAP_MS)
}

async function send(service: string, url: string, init: RequestInit | undefined, timeoutMs: number) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" })
  } catch (error) {
    console.error(`${service} request failed`, error instanceof Error ? error.name : error)
    throw upstreamFailed(service)
  }
}

// Calls a third-party API with a hard timeout and checks the shape of what comes back.
// Keys, URLs and upstream messages stay in the server log, never in the response to the browser.
export async function fetchUpstream<T>(request: UpstreamRequest<T>): Promise<T> {
  const { service, url, init, timeoutMs, schema, retryOnRateLimit = false, emptyOn } = request
  let response = await send(service, url, init, timeoutMs)

  if (response.status === 429 && retryOnRateLimit) {
    await new Promise((resolve) => setTimeout(resolve, retryDelayMs(response.headers.get("retry-after"))))
    response = await send(service, url, init, timeoutMs)
  }

  if (emptyOn && response.status === emptyOn.status) return emptyOn.value

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
