import "server-only"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { publicEnv } from "@/lib/env/public"
import type { Database } from "@/types/database"

// Acts as the caller, signed in or not, so every query is filtered by row level security.
export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
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
