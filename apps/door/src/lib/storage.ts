import AsyncStorage from "@react-native-async-storage/async-storage"
import type { Pending, QueueStore } from "./queue"

const KEY = "loudnight.door.queue"

// Waiting arrivals survive the app being closed. They hold no personal details, so plain app storage is enough.
export const queueStore: QueueStore = {
  async load() {
    const raw = await AsyncStorage.getItem(KEY)
    try {
      return raw ? (JSON.parse(raw) as Pending[]) : []
    } catch {
      return []
    }
  },
  async save(items) {
    await AsyncStorage.setItem(KEY, JSON.stringify(items))
  },
}
