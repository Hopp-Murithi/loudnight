import { describe, expect, it } from "vitest"
import { createEventStream } from "./stream"

describe("createEventStream", () => {
  it("writes one JSON object per line", async () => {
    const events = createEventStream<{ n: number }>()
    events.send({ n: 1 })
    events.send({ n: 2 })
    events.close()
    expect(await new Response(events.stream).text()).toBe('{"n":1}\n{"n":2}\n')
  })

  // The work behind the stream must be able to finish after the reader leaves.
  it("stops writing quietly once the reader has gone", async () => {
    const reader = new AbortController()
    const events = createEventStream<{ n: number }>(reader.signal)
    expect(events.connected()).toBe(true)
    reader.abort()
    expect(events.connected()).toBe(false)
    expect(() => events.send({ n: 1 })).not.toThrow()
    expect(() => events.close()).not.toThrow()
  })

  it("notices a cancelled stream", async () => {
    const events = createEventStream<{ n: number }>()
    await events.stream.cancel()
    expect(events.connected()).toBe(false)
  })
})
