export const SITE = {
  name: "Encore",
  tagline: "Fill your quiet nights.",
  description:
    "Encore reads your neighbourhood's taste, finds the night nobody nearby is running, and gives you a four-week event series ready to launch.",
  credit: "Encore is open source under the MIT licence. Taste data from Qloo.",
} as const

export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  checkEmail: "/check-email",
  authConfirm: "/auth/confirm",
  setPassword: "/set-password",
  account: "/account",
  admin: "/admin",
  venues: "/venues",
  newVenue: "/venues/new",
  venue: (id: string) => `/venues/${id}`,
  venuePlan: (id: string) => `/venues/${id}/plan`,
  venueRun: (id: string, runId: string) => `/venues/${id}/plan/${runId}`,
  venueSeries: (id: string) => `/venues/${id}/series`,
  venuePromote: (id: string) => `/venues/${id}/promote`,
  venueDoor: (id: string) => `/venues/${id}/door`,
  venueResults: (id: string) => `/venues/${id}/results`,
  venueTeam: (id: string) => `/venues/${id}/team`,
  venueSettings: (id: string) => `/venues/${id}/settings`,
  venueHistory: (id: string) => `/venues/${id}/history`,
  demo: (id: string) => `/demo/${id}`,
  eventPage: (slug: string) => `/e/${slug}`,
} as const

// Where a signed-in person lands when nothing else was asked for.
export const SIGNED_IN_HOME = ROUTES.venues

// Paths that need a session. Everything else, demo venues and event pages included, is public.
export const SIGNED_IN_PREFIXES = [ROUTES.venues, ROUTES.account, ROUTES.admin, ROUTES.setPassword] as const

// Pages for people who are not signed in. A signed-in person is sent on to their venues.
export const SIGNED_OUT_PAGES = [ROUTES.login, ROUTES.signup, ROUTES.forgotPassword, ROUTES.checkEmail] as const

export const API_BASE = "/api/v1"

// Set when a reset or invite link is accepted; until a password is saved, every page leads to the password form.
export const PASSWORD_PENDING_COOKIE = "encore_password_pending"

// Only same-site paths, so a crafted link cannot send anyone elsewhere.
export function safeNextPath(next: string | null | undefined): string | null {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : null
}
