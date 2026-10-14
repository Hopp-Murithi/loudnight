import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { checkinSchema, type CheckinInput } from "@/modules/door/door.schemas"
import { doorService } from "@/modules/door/door.service"

// Owners, managers and door staff check guests in. RLS allows it only at their own venues.
export const POST = apiRoute<CheckinInput, { id: string }>(
  { body: checkinSchema, rateLimit: RATE_LIMITS.checkin },
  ({ ctx, params, body }) => doorService.checkIn(ctx, params.id, body),
)
