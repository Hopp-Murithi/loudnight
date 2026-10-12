import { NextResponse, type NextRequest } from "next/server"
import { ROUTES, SIGNED_IN_PREFIXES } from "@/config/site"
import { refreshSession } from "@/lib/supabase/proxy"

const needsSession = (pathname: string) =>
  SIGNED_IN_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))

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

  if (pathname.startsWith("/api/") || claims || !needsSession(pathname)) return response

  const start = new URL(ROUTES.start, request.url)
  start.searchParams.set("next", pathname)
  return redirectTo(start, response)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
}
