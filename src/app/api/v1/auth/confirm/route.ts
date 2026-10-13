import { NextResponse, type NextRequest } from "next/server"
import { PASSWORD_PENDING_COOKIE, ROUTES } from "@/config/site"
import { createServerSupabase } from "@/lib/supabase/server"
import { needsPassword } from "@/modules/auth/auth.links"
import { confirmLinkSchema } from "@/modules/auth/auth.schemas"
import { authService } from "@/modules/auth/auth.service"

// Public and posted from the confirm page's button, so a mail scanner that only opens links cannot use up a token.
export async function POST(request: NextRequest) {
  const parsed = confirmLinkSchema.safeParse(Object.fromEntries(await request.formData()))
  const next = parsed.success
    ? await authService.confirmLink(await createServerSupabase(), parsed.data.token_hash, parsed.data.type)
    : null

  if (!next || !parsed.success) {
    return NextResponse.redirect(new URL(`${ROUTES.authConfirm}?error=link_expired`, request.url), 303)
  }
  const response = NextResponse.redirect(new URL(next, request.url), 303)
  if (needsPassword(parsed.data.type)) {
    response.cookies.set(PASSWORD_PENDING_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60,
    })
  }
  return response
}
