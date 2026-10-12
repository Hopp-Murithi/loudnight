import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import type { AppRole } from "@/config/roles"
import { ROUTES } from "@/config/site"
import { forbidden, unauthorized } from "@/lib/http/errors"
import { createServerSupabase } from "@/lib/supabase/server"
import type { RequestContext } from "../types"

// Verifies the token, then reads the profile so the role is always fresh.
const loadContext = cache(async (): Promise<RequestContext | null> => {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, is_anonymous")
    .eq("id", userId)
    .maybeSingle()
  if (!profile) return null

  return {
    supabase,
    user: {
      id: profile.id,
      displayName: profile.display_name,
      role: profile.role,
      isAnonymous: profile.is_anonymous,
    },
  }
})

const allows = (roles: AppRole[] | undefined, role: AppRole) => !roles || roles.includes(role)

// For API routes: throws typed errors the route wrapper turns into 401 or 403.
export async function getApiContext(roles?: AppRole[]): Promise<RequestContext> {
  const ctx = await loadContext()
  if (!ctx) throw unauthorized()
  if (!allows(roles, ctx.user.role)) throw forbidden()
  return ctx
}

// For pages and layouts: redirects instead of throwing.
export async function getPageContext(...roles: AppRole[]): Promise<RequestContext> {
  const ctx = await loadContext()
  if (!ctx) redirect(ROUTES.start)
  if (!allows(roles.length > 0 ? roles : undefined, ctx.user.role)) redirect(ROUTES.home)
  return ctx
}
