export const SITE = {
  name: "Encore",
  tagline: "Fill your quiet nights.",
  description:
    "Encore reads your neighbourhood's taste, finds the night nobody nearby is running, and gives you a four-week event series ready to launch.",
  credit: "Encore is open source under the MIT licence. Taste data from Qloo.",
} as const

export const ROUTES = {
  home: "/",
  start: "/start",
  account: "/account",
  admin: "/admin",
  venues: "/venues",
  newVenue: "/venues/new",
  venue: (id: string) => `/venues/${id}`,
  venuePlan: (id: string) => `/venues/${id}/plan`,
  venueSeries: (id: string) => `/venues/${id}/series`,
  venueDoor: (id: string) => `/venues/${id}/door`,
  venueResults: (id: string) => `/venues/${id}/results`,
  venueTeam: (id: string) => `/venues/${id}/team`,
  venueSettings: (id: string) => `/venues/${id}/settings`,
  venueHistory: (id: string) => `/venues/${id}/history`,
  demo: (id: string) => `/demo/${id}`,
  eventPage: (slug: string) => `/e/${slug}`,
} as const

// Paths that need a session. Everything else, demo venues and event pages included, is public.
export const SIGNED_IN_PREFIXES = [ROUTES.venues, ROUTES.account, ROUTES.admin] as const

export const API_BASE = "/api/v1"
