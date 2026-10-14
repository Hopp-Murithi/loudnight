import type { CheckinBody } from "./types.ts"

// One arrival made without a connection: only the scanned text, a guest id or a walk-in count, never contact details.
export interface Pending {
  key: string
  nightId: string
  body: CheckinBody
  at: string
}

export interface QueueStore {
  load(): Promise<Pending[]>
  save(items: Pending[]): Promise<void>
}

// What happened when one waiting arrival was sent: recorded or refused (both leave the queue), or still offline.
export type Outcome = "sent" | "refused" | "offline"

export async function enqueue(store: QueueStore, item: Pending): Promise<number> {
  const items = await store.load()
  if (!items.some((existing) => existing.key === item.key)) items.push(item)
  await store.save(items)
  return items.length
}

// Sends waiting arrivals oldest first and stops at the first that still cannot get through, keeping it and the rest.
export async function flush(
  store: QueueStore,
  send: (item: Pending) => Promise<Outcome>,
): Promise<{ sent: number; refused: number; left: number }> {
  const items = await store.load()
  let sent = 0
  let refused = 0
  let index = 0
  for (; index < items.length; index += 1) {
    const item = items[index]
    if (!item) break
    const outcome = await send(item)
    if (outcome === "offline") break
    if (outcome === "sent") sent += 1
    else refused += 1
  }
  const left = items.slice(index)
  await store.save(left)
  return { sent, refused, left: left.length }
}
