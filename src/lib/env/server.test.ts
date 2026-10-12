import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const ORIGINAL = { ...process.env }

async function loadEnv() {
  vi.resetModules()
  return import("./server")
}

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key"
})

afterEach(() => {
  process.env = { ...ORIGINAL }
})

describe("serviceEnv", () => {
  it("reads the service role key", async () => {
    const { serviceEnv } = await loadEnv()
    expect(serviceEnv().SUPABASE_SERVICE_ROLE_KEY).toBe("service-key")
  })

  it("rejects a missing service key", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = ""
    const { serviceEnv } = await loadEnv()
    expect(() => serviceEnv()).toThrow()
  })

  // Each concern is validated on its own, so one missing upstream key cannot break the database.
  it("does not need any upstream key", async () => {
    delete process.env.QLOO_API_KEY
    delete process.env.ANTHROPIC_API_KEY
    const { serviceEnv, isConfigured } = await loadEnv()
    expect(serviceEnv().SUPABASE_SERVICE_ROLE_KEY).toBe("service-key")
    expect(isConfigured("qloo")).toBe(false)
  })
})

describe("aiEnv", () => {
  it("rejects a key that is not an Anthropic key", async () => {
    process.env.ANTHROPIC_API_KEY = "not-a-key"
    const { aiEnv, isConfigured } = await loadEnv()
    expect(isConfigured("ai")).toBe(false)
    expect(() => aiEnv()).toThrow()
  })

  it("reads an Anthropic key", async () => {
    process.env.ANTHROPIC_API_KEY = "sk-ant-test"
    const { aiEnv } = await loadEnv()
    expect(aiEnv().ANTHROPIC_API_KEY).toBe("sk-ant-test")
  })
})

describe("qlooEnv", () => {
  it("falls back to the hackathon endpoint when no URL is set", async () => {
    process.env.QLOO_API_KEY = "qloo-key"
    delete process.env.QLOO_API_URL
    const { qlooEnv } = await loadEnv()
    expect(qlooEnv().QLOO_API_URL).toBe("https://hackathon.api.qloo.com")
  })
})
