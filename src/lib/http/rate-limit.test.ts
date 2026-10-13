import { describe, expect, it } from "vitest"
import { AppError } from "./errors"
import { clientIp, enforceRateLimit, rateLimitBucket, setRateLimiter, type RateLimiter } from "./rate-limit"

const RULE = { name: "auth-login", max: 2, windowSeconds: 60 }

function countingLimiter(): RateLimiter {
  const hits = new Map<string, number>()
  return {
    async consume(bucket, rule) {
      const next = (hits.get(bucket) ?? 0) + 1
      hits.set(bucket, next)
      return next <= rule.max
    },
  }
}

describe("clientIp", () => {
  it("takes the first address Vercel forwards", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7")
  })

  it("falls back to x-real-ip, then to one shared bucket", () => {
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2" }))).toBe("198.51.100.2")
    expect(clientIp(new Headers())).toBe("unknown")
  })
})

describe("rateLimitBucket", () => {
  // The raw address never reaches the database.
  it("hashes the IP and keeps the rule's name", () => {
    const bucket = rateLimitBucket(RULE, "203.0.113.7")
    expect(bucket).toMatch(/^auth-login:[0-9a-f]{32}$/)
    expect(bucket).not.toContain("203.0.113.7")
  })

  it("gives different addresses different buckets", () => {
    expect(rateLimitBucket(RULE, "203.0.113.7")).not.toBe(rateLimitBucket(RULE, "203.0.113.8"))
  })
})

describe("enforceRateLimit", () => {
  it("lets requests through up to the limit, then refuses with a 429", async () => {
    setRateLimiter(countingLimiter())
    const headers = new Headers({ "x-forwarded-for": "203.0.113.7" })

    await expect(enforceRateLimit(headers, RULE)).resolves.toBeUndefined()
    await expect(enforceRateLimit(headers, RULE)).resolves.toBeUndefined()
    const error = await enforceRateLimit(headers, RULE).catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(AppError)
    expect((error as AppError).status).toBe(429)
  })

  it("counts each network on its own", async () => {
    setRateLimiter(countingLimiter())
    for (let i = 0; i < 2; i++) await enforceRateLimit(new Headers({ "x-forwarded-for": "203.0.113.7" }), RULE)

    await expect(enforceRateLimit(new Headers({ "x-forwarded-for": "203.0.113.9" }), RULE)).resolves.toBeUndefined()
  })
})
