import { ROUTES } from "@/config/site"
import { publicEnv } from "@/lib/env/public"

// Full links, for QR codes, captions and calendars, which leave the site.
export const eventUrl = (slug: string) => new URL(ROUTES.eventPage(slug), publicEnv.NEXT_PUBLIC_APP_URL).toString()
export const ticketUrl = (slug: string, code: string) =>
  new URL(ROUTES.ticket(slug, code), publicEnv.NEXT_PUBLIC_APP_URL).toString()

// The door's own QR: guests scan it on arrival to check themselves in.
export const selfCheckinUrl = (slug: string) =>
  new URL(`${ROUTES.eventPage(slug)}/here`, publicEnv.NEXT_PUBLIC_APP_URL).toString()
