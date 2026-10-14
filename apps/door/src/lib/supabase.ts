import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"
import { SUPABASE_KEY, SUPABASE_URL } from "../config"

// The session lives in the phone's secure keychain. Each value there is limited in size, so it is stored in parts.
const PART = 1800

const secureStorage = {
  async getItem(key: string) {
    const count = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? "0")
    if (!count) return null
    const parts = await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}.${i}`)))
    return parts.every((part) => part !== null) ? parts.join("") : null
  },
  async setItem(key: string, value: string) {
    const parts = Array.from({ length: Math.ceil(value.length / PART) }, (_, i) =>
      value.slice(i * PART, (i + 1) * PART),
    )
    await Promise.all(parts.map((part, i) => SecureStore.setItemAsync(`${key}.${i}`, part)))
    await SecureStore.setItemAsync(`${key}.n`, String(parts.length))
  },
  async removeItem(key: string) {
    const count = Number((await SecureStore.getItemAsync(`${key}.n`)) ?? "0")
    await Promise.all(Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}.${i}`)))
    await SecureStore.deleteItemAsync(`${key}.n`)
  },
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { storage: secureStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
})
