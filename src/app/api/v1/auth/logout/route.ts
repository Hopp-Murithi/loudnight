import { cookies } from "next/headers"
import { PASSWORD_PENDING_COOKIE, ROUTES } from "@/config/site"
import { publicApiRoute } from "@/lib/http/route"
import type { RedirectResult } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

// Public so a broken or expired session can always sign out.
export const POST = publicApiRoute({}, async ({ supabase }) => {
  await authService.signOut(supabase)
  ;(await cookies()).delete(PASSWORD_PENDING_COOKIE)
  return { redirectTo: ROUTES.login } satisfies RedirectResult
})
