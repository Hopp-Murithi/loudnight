import { describe, expect, it, vi } from "vitest"
import type { ServerSupabase } from "@/lib/supabase/server"

const listDemo = vi.fn()
vi.mock("./venues.repository", () => ({ venuesRepository: { listDemo: (...args: unknown[]) => listDemo(...args) } }))

const { venuesService } = await import("./venues.service")

describe("venuesService.listDemoVenues", () => {
  it("marks a venue ready only when a run has succeeded", async () => {
    listDemo.mockResolvedValue([
      {
        id: "a",
        name: "The Copper Room",
        address: "Brooklyn",
        venue_type: "bar",
        agent_runs: [{ status: "succeeded" }],
      },
      { id: "b", name: "Logan Corner Cafe", address: "Chicago", venue_type: "cafe", agent_runs: [] },
    ])

    const venues = await venuesService.listDemoVenues({} as ServerSupabase)

    expect(venues).toEqual([
      { id: "a", name: "The Copper Room", address: "Brooklyn", venueType: "bar", planReady: true },
      { id: "b", name: "Logan Corner Cafe", address: "Chicago", venueType: "cafe", planReady: false },
    ])
  })
})
