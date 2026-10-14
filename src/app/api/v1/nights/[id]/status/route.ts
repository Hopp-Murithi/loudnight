import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { nightActionSchema } from "@/modules/events/events.schemas"
import { eventsService } from "@/modules/events/events.service"

// Owners and managers publish, take back or cancel a night. RLS refuses door staff and everyone else.
export const POST = apiRoute<{ action: "publish" | "unpublish" | "cancel" }, { id: string }>(
  { body: nightActionSchema, rateLimit: RATE_LIMITS.nightStatus },
  ({ ctx, params, body }) => eventsService.changeNight(ctx, params.id, body.action),
)
