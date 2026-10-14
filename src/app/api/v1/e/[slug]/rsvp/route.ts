import { RATE_LIMITS } from "@/config/limits"
import { publicApiRoute } from "@/lib/http/route"
import { rsvpSchema, type RsvpValues } from "@/modules/events/events.schemas"
import { eventsService } from "@/modules/events/events.service"

// Public: guests have no account. Rate limited per IP; the database lets a guest write only to a published night.
export const POST = publicApiRoute<RsvpValues, { slug: string }>(
  { body: rsvpSchema, rateLimit: RATE_LIMITS.rsvp },
  ({ supabase, params, body }) => eventsService.rsvp(supabase, params.slug, body),
)
