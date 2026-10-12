import "server-only"

export const NDJSON = "application/x-ndjson"

export interface EventStream<TEvent> {
  stream: ReadableStream<Uint8Array>
  send: (event: TEvent) => void
  close: () => void
  connected: () => boolean
}

// One JSON object per line. Writing stops quietly once the reader has gone, so the work behind it can finish.
export function createEventStream<TEvent>(signal?: AbortSignal): EventStream<TEvent> {
  const encoder = new TextEncoder()
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined
  let open = !signal?.aborted

  const stream = new ReadableStream<Uint8Array>({
    start: (value) => {
      controller = value
    },
    cancel: () => {
      open = false
    },
  })
  signal?.addEventListener("abort", () => {
    open = false
  })

  return {
    stream,
    send: (event) => {
      if (open) controller?.enqueue(encoder.encode(`${JSON.stringify(event)}\n`))
    },
    close: () => {
      if (!open) return
      open = false
      controller?.close()
    },
    connected: () => open,
  }
}
