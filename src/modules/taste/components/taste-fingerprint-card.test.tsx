import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import type { TasteFingerprint } from "../taste.schemas"
import { TasteFingerprintCard } from "./taste-fingerprint-card"

const receipt = { cacheId: "00000000-0000-4000-8000-000000000000", path: ["results", "tags", "0", "query", "affinity"] }

const fingerprint: TasteFingerprint = {
  domains: [
    {
      domain: "music_styles",
      label: "Music styles",
      status: "ok",
      items: [{ id: "a", name: "Sample soul", affinity: 0.987, score: 1, popularity: null, receipt }],
    },
    { domain: "podcasts", label: "Podcasts", status: "empty", items: [] },
    { domain: "books", label: "Books", status: "failed", items: [] },
  ],
  audience: {
    basedOn: [{ id: "a", name: "Sample soul" }],
    age: [{ key: "25_to_29", label: "25 to 29", value: 0.6, receipt }],
    gender: [{ key: "male", label: "Men", value: -0.25, receipt }],
  },
}

describe("TasteFingerprintCard", () => {
  it("ranks each domain by name, strongest first, without saturated scores", () => {
    render(<TasteFingerprintCard fingerprint={fingerprint} />)
    expect(screen.getByText("Sample soul", { selector: "li" })).toBeInTheDocument()
    expect(screen.queryByText("0.99")).not.toBeInTheDocument()
    expect(screen.getByText(/1 of 3 areas of taste/)).toBeInTheDocument()
  })

  it("says when a domain is empty or failed instead of leaving it blank", () => {
    render(<TasteFingerprintCard fingerprint={fingerprint} />)
    expect(screen.getByText("Not enough data nearby")).toBeInTheDocument()
    expect(screen.getByText(/Could not read this one/)).toBeInTheDocument()
  })

  it("keeps the audience lean readable by screen readers", () => {
    render(<TasteFingerprintCard fingerprint={fingerprint} />)
    const young = screen.getByRole("meter", { name: "25 to 29" })
    expect(young).toHaveAttribute("aria-valuenow", "0.6")
    expect(young).toHaveAttribute("aria-valuetext", "+0.60, more than average")
    expect(screen.getByRole("meter", { name: "Men" })).toHaveAttribute("aria-valuetext", "-0.25, less than average")
  })
})
