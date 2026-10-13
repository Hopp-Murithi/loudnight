import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { talentService } from "@/modules/talent/talent.service"

type Params = { id: string }

export const maxDuration = 60

// Owners and managers build or refresh the shortlist. It costs Qloo and copy calls, so it is rate limited.
export const POST = apiRoute<undefined, Params>({ rateLimit: RATE_LIMITS.talentFind }, async ({ ctx, params }) =>
  talentService.find(ctx, params.id),
)
