/// <reference types="node" />
import assert from "node:assert/strict"
import { test } from "node:test"
import { enqueue, flush, type Pending, type QueueStore } from "./queue.ts"

const memory = (): QueueStore & { items: Pending[] } => {
  const box = { items: [] as Pending[] }
  return Object.assign(box, {
    load: async () => [...box.items],
    save: async (items: Pending[]) => {
      box.items = items
    },
  })
}

const item = (key: string): Pending => ({ key, nightId: "n1", body: { code: key }, at: "2026-10-20T20:00:00Z" })

test("keeps each arrival once, however often it is queued", async () => {
  const store = memory()
  await enqueue(store, item("a"))
  assert.equal(await enqueue(store, item("a")), 1)
  assert.equal(await enqueue(store, item("b")), 2)
})

test("sends oldest first, drops recorded and refused ones, and stops at the first still offline", async () => {
  const store = memory()
  for (const key of ["a", "b", "c", "d"]) await enqueue(store, item(key))
  const outcomes: Record<string, "sent" | "refused" | "offline"> = { a: "sent", b: "refused", c: "offline", d: "sent" }
  const result = await flush(store, async (pending) => outcomes[pending.key] ?? "offline")
  assert.deepEqual(result, { sent: 1, refused: 1, left: 2 })
  assert.deepEqual(
    store.items.map((pending) => pending.key),
    ["c", "d"],
  )
})

test("holds no contact details: only scanned text, a guest id or a walk-in count", async () => {
  const store = memory()
  await enqueue(store, { ...item("w"), body: { walkIn: true, partySize: 3, clientKey: "k" } })
  assert.deepEqual(Object.keys(store.items[0]?.body ?? {}).sort(), ["clientKey", "partySize", "walkIn"])
})
