import { cookies } from "next/headers"
import { PASSWORD_PENDING_COOKIE } from "@/config/site"
import { apiRoute } from "@/lib/http/route"
import { setPasswordSchema, type RedirectResult, type SetPasswordInput } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

export const POST = apiRoute<SetPasswordInput>({ body: setPasswordSchema }, async ({ ctx, body }) => {
  const redirectTo = await authService.setPassword(ctx, body.password)
  ;(await cookies()).delete(PASSWORD_PENDING_COOKIE)
  return { redirectTo } satisfies RedirectResult
})
