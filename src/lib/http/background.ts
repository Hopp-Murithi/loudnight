import "server-only"
import { after } from "next/server"

// Work that must not delay or shape the response, such as sending an email. Failures are logged, never shown.
export function runAfterResponse(label: string, task: () => Promise<unknown>): void {
  after(() =>
    task().catch((error: unknown) => {
      console.error(`${label} failed: ${error instanceof Error ? error.message : "unknown error"}`)
    }),
  )
}

// Keeps the server working until the task settles, even after the reader of a stream has gone away.
export function keepAlive(label: string, task: Promise<unknown>): void {
  after(() =>
    task.catch((error: unknown) => {
      console.error(`${label} failed: ${error instanceof Error ? error.message : "unknown error"}`)
    }),
  )
}
