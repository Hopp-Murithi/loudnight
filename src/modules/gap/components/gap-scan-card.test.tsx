import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { GapScan } from "../gap.schemas"
import { GapScanCard } from "./gap-scan-card"

const base: GapScan = {
  weekday: "tuesday",
  nights: ["2026-10-13", "2026-10-20", "2026-10-27", "2026-11-03"],
  venues: [{ placeId: "p", name: "Sample Pub", type: "Pub", rating: 4.2, distanceMetres: 340 }],
  events: [],
  themes: [{ theme: "Trivia", examples: [], count: 4 }],
  sources: { places: "ok", events: "ok", themes: "ok" },
  noveltyNeutral: false,
}

describe("GapScanCard", () => {
  it("names the night, the sources and the covered themes with their counts", () => {
    render(<GapScanCard scan={base} scout={null} radiusMetres={2000} />)
    expect(screen.getByRole("heading", { name: /Tuesdays nearby/ })).toBeInTheDocument()
    expect(screen.getByText("From Google Places")).toBeInTheDocument()
    expect(screen.getByText("From Ticketmaster")).toBeInTheDocument()
    expect(screen.getByRole("list", { name: "Already covered nearby" })).toHaveTextContent("Trivia4")
    expect(screen.getByText("340 m")).toBeInTheDocument()
  })

  it("turns an empty night into the opening", () => {
    render(<GapScanCard scan={base} scout={null} radiusMetres={2000} />)
    expect(screen.getByText(/That is your opening/)).toBeInTheDocument()
  })

  it("says which source failed and flags neutral freshness when both did", () => {
    const down: GapScan = {
      ...base,
      sources: { places: "failed", events: "failed", themes: "failed" },
      noveltyNeutral: true,
    }
    render(<GapScanCard scan={down} scout={null} radiusMetres={2000} />)
    expect(screen.getByText(/Google Places did not answer/)).toBeInTheDocument()
    expect(screen.getByText(/Ticketmaster did not answer/)).toBeInTheDocument()
    expect(screen.getByRole("status")).toHaveTextContent(/scored as neutral/)
  })
})
