import { NextResponse, type NextRequest } from "next/server"
import { PASSWORD_PENDING_COOKIE, ROUTES, SIGNED_IN_HOME, SIGNED_IN_PREFIXES, SIGNED_OUT_PAGES } from "@/config/site"
import { refreshSession } from "@/lib/supabase/proxy"

const matches = (pathname: string, prefixes: readonly string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

// Cookies refreshed during this request must survive a redirect.
function redirectTo(url: URL, source: NextResponse) {
  const response = NextResponse.redirect(url)
  source.cookies.getAll().forEach((cookie) => response.cookies.set(cookie))
  return response
}

// A fast first gate. Real enforcement happens in the API layer and in row level security.
export async function proxy(request: NextRequest) {
  const { claims, getResponse } = await refreshSession(request)
  const response = getResponse()
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/api/")) return response

  if (!claims) {
    if (!matches(pathname, SIGNED_IN_PREFIXES)) return response
    const login = new URL(ROUTES.login, request.url)
    login.searchParams.set("next", pathname)
    return redirectTo(login, response)
  }

  // Someone who opened a reset or invite link saves a password before going anywhere else.
  const passwordPending = request.cookies.has(PASSWORD_PENDING_COOKIE)
  if (passwordPending && pathname !== ROUTES.setPassword && pathname !== ROUTES.authConfirm) {
    return redirectTo(new URL(ROUTES.setPassword, request.url), response)
  }

  if (matches(pathname, SIGNED_OUT_PAGES)) return redirectTo(new URL(SIGNED_IN_HOME, request.url), response)

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
