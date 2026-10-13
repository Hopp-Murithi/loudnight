import { RATE_LIMITS } from "@/config/limits"
import { runAfterResponse } from "@/lib/http/background"
import { publicApiRoute } from "@/lib/http/route"
import { emailOnlySchema, type SentResult } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

// Public: someone who forgot their password cannot sign in to ask.
export const POST = publicApiRoute(
  { body: emailOnlySchema, rateLimit: RATE_LIMITS.passwordReset },
  async ({ body }) => {
    runAfterResponse("Password reset email", () => authService.sendPasswordReset(body.email))
    return { sent: true } satisfies SentResult
  },
)
