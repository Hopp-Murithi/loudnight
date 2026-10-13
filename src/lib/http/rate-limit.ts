import "server-only"
import { createHash } from "node:crypto"
import type { RateLimitRule } from "@/config/limits"
import { createAdminSupabase } from "@/lib/supabase/admin"
import { rateLimited } from "./errors"

export interface RateLimiter {
  consume(bucket: string, rule: RateLimitRule): Promise<boolean>
}

// Vercel puts the caller first in x-forwarded-for; anything else falls back to one shared bucket.
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim()
  return forwarded || headers.get("x-real-ip")?.trim() || "unknown"
}

// The raw address is never stored: only the rule's name and a hash of the IP.
export function rateLimitBucket(rule: RateLimitRule, ip: string): string {
  return `${rule.name}:${createHash("sha256").update(ip).digest("hex").slice(0, 32)}`
}

// Allowed service-role use: the limiter's function is closed to every browser session.
const databaseLimiter: RateLimiter = {
  async consume(bucket, rule) {
    const { data, error } = await createAdminSupabase().rpc("consume_rate_limit", {
      bucket,
      max_hits: rule.max,
      window_seconds: rule.windowSeconds,
    })
    // A limiter failure must not lock everyone out; it is logged and the request goes through.
    if (error) {
      console.error(`Rate limiter unavailable (${error.code ?? "unknown"})`)
      return true
    }
    return data === true
  },
}

let limiter: RateLimiter = databaseLimiter

export const setRateLimiter = (next: RateLimiter) => {
  limiter = next
}

export async function enforceRateLimit(headers: Headers, rule: RateLimitRule): Promise<void> {
  const allowed = await limiter.consume(rateLimitBucket(rule, clientIp(headers)), rule)
  if (!allowed) throw rateLimited("Too many tries from this network. Wait a few minutes and try again.")
}
