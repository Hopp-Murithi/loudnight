import { API_BASE } from "@/config/site"

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

interface Envelope<T> {
  data?: T
  error?: { code: string; message: string; details?: Record<string, string[]> }
}

async function unwrapResponse<T>(response: Response): Promise<T> {
  const envelope = (await response.json().catch(() => ({}))) as Envelope<T>
  if (!response.ok || envelope.error) {
    throw new ApiError(
      envelope.error?.code ?? "internal",
      envelope.error?.message ?? "Something went wrong. Try again.",
      envelope.error?.details,
    )
  }
  return envelope.data as T
}

export async function apiFetch<T>(path: string, init?: Omit<RequestInit, "body"> & { body?: unknown }): Promise<T> {
  return unwrapResponse(
    await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
      body: init?.body === undefined ? undefined : JSON.stringify(init.body),
    }),
  )
}

// Reads a newline-delimited JSON stream, handing each event over as soon as its line is complete.
export async function apiStream<TEvent>(
  path: string,
  body: unknown,
  onEvent: (event: TEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  })
  if (!response.ok || !response.body) {
    await unwrapResponse(response)
    return
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ""
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    lines.filter(Boolean).forEach((line) => onEvent(JSON.parse(line) as TEvent))
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as TEvent)
}
