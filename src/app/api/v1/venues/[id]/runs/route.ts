import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { startRunSchema, type StartRunInput } from "@/modules/runs/runs.schemas"
import { runsService } from "@/modules/runs/runs.service"

type Params = { id: string }

// Owners and managers; limited per IP here and capped per person per hour in the database.
export const POST = apiRoute<StartRunInput, Params>(
  { rateLimit: RATE_LIMITS.runStart, body: startRunSchema },
  async ({ ctx, params, body }) => runsService.start(ctx, params.id, body.weekday),
)
