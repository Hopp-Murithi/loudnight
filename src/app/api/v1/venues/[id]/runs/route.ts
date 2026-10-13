import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { runsService } from "@/modules/runs/runs.service"

type Params = { id: string }

// Owners and managers; limited per IP here and capped per person per hour in the database.
export const POST = apiRoute<undefined, Params>({ rateLimit: RATE_LIMITS.runStart }, async ({ ctx, params }) =>
  runsService.start(ctx, params.id),
)
