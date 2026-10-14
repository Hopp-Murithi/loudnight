import { cookies } from "next/headers"
import { PASSWORD_PENDING_COOKIE, PREVIEW_COOKIE, ROUTES } from "@/config/site"
import { publicApiRoute } from "@/lib/http/route"
import type { RedirectResult } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

// Public so a broken or expired session can always sign out.
export const POST = publicApiRoute({}, async ({ supabase }) => {
  await authService.signOut(supabase)
  const jar = await cookies()
  jar.delete(PASSWORD_PENDING_COOKIE)
  jar.delete(PREVIEW_COOKIE)
  return { redirectTo: ROUTES.login } satisfies RedirectResult
})
