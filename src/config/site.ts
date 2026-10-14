export const SITE = {
  name: "Loudnight",
  tagline: "Fill your quiet nights.",
  description:
    "Loudnight reads your neighbourhood's taste, finds the night nobody nearby is running, and gives you a four-week event series ready to launch.",
  credit: "Loudnight is open source under the MIT licence. Taste data from Qloo.",
} as const

// Pages about one quiet night carry it in the address, so a link opens the same night.
const withNight = (path: string, night?: string) => (night ? `${path}?night=${night}` : path)

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
  adminVenues: "/admin/venues",
  adminPeople: "/admin/people",
  adminAudit: "/admin/audit",
  venues: "/venues",
  newVenue: "/venues/new",
  venue: (id: string, night?: string) => withNight(`/venues/${id}`, night),
  venuePlan: (id: string, night?: string) => withNight(`/venues/${id}/plan`, night),
  venueRun: (id: string, runId: string) => `/venues/${id}/plan/${runId}`,
  venueSeries: (id: string, night?: string) => withNight(`/venues/${id}/series`, night),
  venuePromote: (id: string, night?: string) => withNight(`/venues/${id}/promote`, night),
  venueDoor: (id: string) => `/venues/${id}/door`,
  venueResults: (id: string) => `/venues/${id}/results`,
  venueTeam: (id: string) => `/venues/${id}/team`,
  venueSettings: (id: string) => `/venues/${id}/settings`,
  venueHistory: (id: string) => `/venues/${id}/history`,
  demo: (id: string) => `/demo/${id}`,
  eventPage: (slug: string) => `/e/${slug}`,
  ticket: (slug: string, code: string) => `/e/${slug}/ticket/${code}`,
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
