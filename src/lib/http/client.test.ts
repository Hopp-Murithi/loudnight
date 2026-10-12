import { afterEach, describe, expect, it, vi } from "vitest"
import { ApiError, apiStream } from "./client"

const streamOf = (chunks: string[]) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(new TextEncoder().encode(chunk)))
      controller.close()
    },
  })

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("apiStream", () => {
  it("hands over each event once its line is complete, even across chunks", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(streamOf(['{"n":1}\n{"n"', ':2}\n{"n":3}']))),
    )
    const events: unknown[] = []
    await apiStream("/x", {}, (event) => events.push(event))
    expect(events).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }])
  })

  it("raises the server's error for a refused request", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: { code: "forbidden", message: "You do not have access to this." } }, { status: 403 }),
      ),
    )
    await expect(apiStream("/x", {}, () => undefined)).rejects.toBeInstanceOf(ApiError)
  })
})
