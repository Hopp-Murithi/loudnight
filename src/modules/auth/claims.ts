import type { JwtPayload } from "@supabase/supabase-js"
import { isAppRole, ROLES, type AppRole } from "@/config/roles"

// A routing hint read from the token. Data access never relies on it; row level security does.
export function roleHintFromClaims(claims: JwtPayload | null): AppRole | null {
  if (!claims?.sub) return null
  const role = claims.app_metadata?.role
  return isAppRole(role) ? role : ROLES.owner
}
