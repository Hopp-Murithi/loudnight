import { RATE_LIMITS } from "@/config/limits"
import { publicApiRoute } from "@/lib/http/route"
import { selfCheckinSchema, type SelfCheckinInput } from "@/modules/door/door.schemas"
import { doorService } from "@/modules/door/door.service"

// Public: a guest at the door has no account. Rate limited per IP; the database allows it only around the start.
export const POST = publicApiRoute<SelfCheckinInput, { slug: string }>(
  { body: selfCheckinSchema, rateLimit: RATE_LIMITS.selfCheckin },
  ({ supabase, params, body }) => doorService.selfCheckIn(supabase, params.slug, body.partySize),
)
