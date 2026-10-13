import { RATE_LIMITS } from "@/config/limits"
import { SIGNED_IN_HOME } from "@/config/site"
import { publicApiRoute } from "@/lib/http/route"
import { loginSchema, type RedirectResult } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

// Public: signing in is how a session starts.
export const POST = publicApiRoute({ body: loginSchema, rateLimit: RATE_LIMITS.signIn }, async ({ supabase, body }) => {
  await authService.signIn(supabase, body)
  return { redirectTo: SIGNED_IN_HOME } satisfies RedirectResult
})
