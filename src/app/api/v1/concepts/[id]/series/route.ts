import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { seriesService } from "@/modules/series/series.service"

type Params = { id: string }

export const maxDuration = 60

// Owners and managers only: the service checks the role, and the database refuses door staff, guests and previews.
export const POST = apiRoute<undefined, Params>({ rateLimit: RATE_LIMITS.seriesCreate }, async ({ ctx, params }) =>
  seriesService.create(ctx, params.id),
)
