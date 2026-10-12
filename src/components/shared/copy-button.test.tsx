import { act, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const toastError = vi.fn()
vi.mock("sonner", () => ({ toast: { error: (message: string) => toastError(message) } }))

const { CopyButton } = await import("./copy-button")

const writeText = vi.fn()

beforeEach(() => {
  writeText.mockReset()
  toastError.mockReset()
  Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe("CopyButton", () => {
  it("copies the text and says so in a live region", async () => {
    writeText.mockResolvedValue(undefined)
    render(<CopyButton text="Afrobeats Tuesday" label="Copy post" />)

    await userEvent.click(screen.getByRole("button", { name: "Copy post" }))

    expect(writeText).toHaveBeenCalledWith("Afrobeats Tuesday")
    expect(screen.getByText("Copied")).toHaveAttribute("aria-live", "polite")
  })

  it("goes back to its label after a moment", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    writeText.mockResolvedValue(undefined)
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
    render(<CopyButton text="x" />)
    await user.click(screen.getByRole("button", { name: "Copy" }))
    expect(screen.getByText("Copied")).toBeInTheDocument()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000)
    })
    expect(screen.getByText("Copy")).toBeInTheDocument()
  })

  // Some browsers refuse the clipboard; the person is told how to copy instead of being left guessing.
  it("explains what to do when the browser refuses", async () => {
    writeText.mockRejectedValue(new Error("denied"))
    render(<CopyButton text="x" />)

    await userEvent.click(screen.getByRole("button", { name: "Copy" }))

    expect(toastError).toHaveBeenCalledWith("Could not copy. Select the text and copy it instead.")
    expect(screen.queryByText("Copied")).not.toBeInTheDocument()
  })
})
