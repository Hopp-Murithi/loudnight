import "server-only"
import { createClient } from "@supabase/supabase-js"
import { publicEnv } from "@/lib/env/public"
import { serviceEnv } from "@/lib/env/server"
import type { Database } from "@/types/database"

// Bypasses row level security. Only for agent output, the shared Qloo cache and demo venue upkeep.
export function createAdminSupabase() {
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serviceEnv().SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export type AdminSupabase = ReturnType<typeof createAdminSupabase>
