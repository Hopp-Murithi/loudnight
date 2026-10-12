import type { AppRole } from "@/config/roles"
import type { ServerSupabase } from "@/lib/supabase/server"

export interface CurrentUser {
  id: string
  displayName: string | null
  role: AppRole
  isAnonymous: boolean
}

// What every service receives: who is calling, and a database client that acts as them.
export interface RequestContext {
  user: CurrentUser
  supabase: ServerSupabase
}
