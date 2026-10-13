import { RATE_LIMITS } from "@/config/limits"
import { runAfterResponse } from "@/lib/http/background"
import { publicApiRoute } from "@/lib/http/route"
import { emailOnlySchema, type SentResult } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

// Public: someone who cannot sign in yet asks for a new confirmation link.
export const POST = publicApiRoute({ body: emailOnlySchema, rateLimit: RATE_LIMITS.verification }, async ({ body }) => {
  runAfterResponse("Verification email", () => authService.resendVerification(body.email))
  return { sent: true } satisfies SentResult
})
