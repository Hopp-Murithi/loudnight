import { RATE_LIMITS } from "@/config/limits"
import { runAfterResponse } from "@/lib/http/background"
import { publicApiRoute } from "@/lib/http/route"
import { signUpSchema, type SentResult } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

// Public: creating an account is how people arrive. The answer is the same whether or not the address is taken.
export const POST = publicApiRoute({ body: signUpSchema, rateLimit: RATE_LIMITS.signUp }, async ({ body }) => {
  runAfterResponse("Sign-up email", () => authService.signUp(body))
  return { sent: true } satisfies SentResult
})
