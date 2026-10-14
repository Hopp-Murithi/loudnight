import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import type { ConceptView, ReceiptView } from "../concepts.schemas"

const mutate = vi.fn()
vi.mock("../hooks/use-choose-concept", () => ({ useChooseConcept: () => ({ mutate, isPending: false }) }))

const { ConceptCard } = await import("./concept-card")
const { ReceiptBody } = await import("./receipt-body")

const concept: ConceptView = {
  id: "c1",
  rank: 1,
  name: "Sample Night",
  pitch: "A sample pitch.",
  reasonBeatsNearby: "Nothing nearby runs it.",
  format: "live_music",
  scores: { audienceFit: 0.95, novelty: 1, venueFit: 0.5, costFit: 1, total: 88 },
  estimatedCostCents: 30000,
  chosen: false,
  evidence: [{ id: "e1", claim: "Sample style is big nearby", value: 0.9876 }],
}

describe("ConceptCard", () => {
  it("shows the total and each part as points out of its weight", () => {
    render(<ConceptCard currency="USD" concept={concept} canChoose onOpenReceipt={vi.fn()} />)
    expect(screen.getByText("88")).toBeInTheDocument()
    expect(screen.getByText("Audience fit").closest("div")).toHaveTextContent("38 of 40")
    expect(screen.getByText("Venue fit").closest("div")).toHaveTextContent("10 of 20")
  })

  it("opens the receipt from the chip, which shows the value to two decimals", async () => {
    const onOpen = vi.fn()
    render(<ConceptCard currency="USD" concept={concept} canChoose onOpenReceipt={onOpen} />)
    const chip = screen.getByRole("button", { name: /Sample style is big nearby.*0\.99.*open the receipt/ })
    await userEvent.click(chip)
    expect(onOpen).toHaveBeenCalledWith("e1")
  })

  it("offers the choice only to people who may make it", async () => {
    const { rerender } = render(
      <ConceptCard currency="USD" concept={concept} canChoose={false} onOpenReceipt={vi.fn()} />,
    )
    expect(screen.queryByRole("button", { name: "Choose this night" })).not.toBeInTheDocument()
    rerender(<ConceptCard currency="USD" concept={concept} canChoose onOpenReceipt={vi.fn()} />)
    await userEvent.click(screen.getByRole("button", { name: "Choose this night" }))
    expect(mutate).toHaveBeenCalledWith("c1")
  })
})

describe("ReceiptBody", () => {
  it("marks the cited line in the answer", () => {
    const receipt: ReceiptView = {
      claim: "x",
      value: 0.9876,
      endpoint: "/v2/insights",
      params: { "filter.type": "urn:tag" },
      fetchedAt: "2026-10-13T09:00:00Z",
      slice: { name: "Sample", popularity: 0.5, query: { affinity: 0.9876 } },
      highlight: ["query", "affinity"],
    }
    const { container } = render(<ReceiptBody receipt={receipt} />)
    const marked = container.querySelector(".font-semibold.block")
    expect(marked?.textContent).toContain('"affinity": 0.9876')
    expect(screen.getByText("filter.type")).toBeInTheDocument()
  })
})
