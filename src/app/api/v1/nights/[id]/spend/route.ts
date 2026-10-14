import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { spendSchema, type SpendInput } from "@/modules/door/door.schemas"
import { doorService } from "@/modules/door/door.service"

// Owners and managers log what a night took. Door staff are refused here and by RLS.
export const PUT = apiRoute<SpendInput, { id: string }>(
  { body: spendSchema, rateLimit: RATE_LIMITS.nightSpend },
  ({ ctx, params, body }) => doorService.logSpend(ctx, params.id, body.amount),
)
