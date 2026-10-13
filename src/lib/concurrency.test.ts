import { describe, expect, it } from "vitest"
import { mapWithLimit } from "./concurrency"

const tick = () => new Promise((resolve) => setTimeout(resolve, 1))

describe("mapWithLimit", () => {
  it("keeps the input order", async () => {
    const result = await mapWithLimit([3, 1, 2], 2, async (value) => {
      await new Promise((resolve) => setTimeout(resolve, value))
      return value * 10
    })
    expect(result).toEqual([30, 10, 20])
  })

  it("never runs more than the limit at once", async () => {
    let running = 0
    let peak = 0
    await mapWithLimit(
      Array.from({ length: 10 }, (_, index) => index),
      3,
      async () => {
        running += 1
        peak = Math.max(peak, running)
        await tick()
        running -= 1
      },
    )
    expect(peak).toBe(3)
  })

  it("handles an empty list", async () => {
    expect(await mapWithLimit([], 3, async () => 1)).toEqual([])
  })
})
