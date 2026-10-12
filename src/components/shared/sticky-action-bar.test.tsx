import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { StickyActionBar } from "./sticky-action-bar"

const bar = () => screen.getByText("Continue").parentElement as HTMLElement

describe("StickyActionBar", () => {
  it("pins the action to the bottom on phones", () => {
    render(
      <StickyActionBar>
        <button type="button">Continue</button>
      </StickyActionBar>,
    )
    expect(bar()).toHaveClass("fixed", "bottom-0", "inset-x-0")
  })

  it("returns to the page flow from tablet width", () => {
    render(
      <StickyActionBar>
        <button type="button">Continue</button>
      </StickyActionBar>,
    )
    expect(bar()).toHaveClass("md:static", "md:border-0", "md:p-0")
  })

  // Without the spacer the last lines of the page would hide behind the bar.
  it("reserves space under the content on phones only", () => {
    const { container } = render(
      <StickyActionBar>
        <button type="button">Continue</button>
      </StickyActionBar>,
    )
    expect(container.querySelector('[data-slot="sticky-spacer"]')).toHaveClass("h-20", "md:hidden")
  })
})
