import "server-only"
import { cache } from "react"
import { redirect } from "next/navigation"
import { ROLES, type AppRole } from "@/config/roles"
import { ROUTES } from "@/config/site"
import { forbidden, unauthorized } from "@/lib/http/errors"
import { createServerSupabase } from "@/lib/supabase/server"
import { previewTarget } from "@/modules/preview/preview.cookie"
import type { RequestContext } from "../types"

// Verifies the token, then reads the profile so the role is always fresh.
const loadContext = cache(async (): Promise<RequestContext | null> => {
  const supabase = await createServerSupabase()
  const { data } = await supabase.auth.getClaims()
  const userId = data?.claims.sub
  if (!userId) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, is_anonymous, is_active")
    .eq("id", userId)
    .maybeSingle()
  if (!profile?.is_active) return null

  const user = toUser(profile)
  if (profile.role === ROLES.administrator) {
    const preview = await previewAs(supabase, user)
    if (preview) return preview
  }
  return { supabase, user }
})

type ProfileRow = {
  id: string
  display_name: string | null
  email: string | null
  role: AppRole
  is_anonymous: boolean
}

const toUser = (profile: ProfileRow) => ({
  id: profile.id,
  displayName: profile.display_name,
  email: profile.email,
  role: profile.role,
  isAnonymous: profile.is_anonymous,
})

// An administrator with a valid preview cookie reads as the person previewed: an active non-administrator only.
async function previewAs(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  admin: RequestContext["user"],
): Promise<RequestContext | null> {
  const targetId = await previewTarget()
  if (!targetId || targetId === admin.id) return null
  const { data: target } = await supabase
    .from("profiles")
    .select("id, display_name, email, role, is_anonymous, is_active")
    .eq("id", targetId)
    .maybeSingle()
  if (!target?.is_active || target.role === ROLES.administrator) return null
  return {
    supabase: await createServerSupabase({ previewUserId: target.id }),
    user: toUser(target),
    preview: { adminId: admin.id, adminName: admin.displayName ?? admin.email ?? "Administrator" },
  }
}

// For public pages: whether a real account is looking, so the header can offer their venues instead of sign in.
export async function hasAccountSession(): Promise<boolean> {
  const ctx = await loadContext()
  return ctx !== null && !ctx.user.isAnonymous
}

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
  if (!ctx) redirect(ROUTES.login)
  if (!allows(roles.length > 0 ? roles : undefined, ctx.user.role)) redirect(ROUTES.home)
  return ctx
}
