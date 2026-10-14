import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies, headers } from "next/headers"
import { PREVIEW_HEADER } from "@/config/site"
import { publicEnv } from "@/lib/env/public"
import type { Database } from "@/types/database"

// Acts as the caller, signed in or not, so every query is filtered by row level security. During an administrator's
// preview it also names the person being previewed, and the database narrows every read to what they may see.
export async function createServerSupabase(options: { previewUserId?: string } = {}) {
  const [cookieStore, token] = await Promise.all([cookies(), bearerToken()])
  const sent = {
    ...(options.previewUserId ? { [PREVIEW_HEADER]: options.previewUserId } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      global: Object.keys(sent).length > 0 ? { headers: sent } : undefined,
      cookies: {
        // The door app signs in with a token, not cookies: its requests ignore any cookie the device may carry.
        getAll: () => (token ? [] : cookieStore.getAll()),
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {
            // Server Components cannot set cookies; the proxy refreshes the session instead.
          }
        },
      },
    },
  )
}

export type ServerSupabase = Awaited<ReturnType<typeof createServerSupabase>>

// The session token a native app sends (`Authorization: Bearer ...`); null for browsers, which use cookies.
export async function bearerToken(): Promise<string | null> {
  const value = (await headers()).get("authorization")
  return value?.startsWith("Bearer ") ? value.slice(7).trim() || null : null
}
