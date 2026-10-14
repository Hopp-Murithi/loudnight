import type { AppRole } from "@/config/roles"
import type { ServerSupabase } from "@/lib/supabase/server"

export interface CurrentUser {
  id: string
  displayName: string | null
  email: string | null
  role: AppRole
  isAnonymous: boolean
}

// What every service receives: who is calling, and a database client that acts as them.
export interface RequestContext {
  user: CurrentUser
  supabase: ServerSupabase
  // Set while an administrator previews someone: user is the person previewed, and nothing may be written.
  preview?: { adminId: string; adminName: string }
}
