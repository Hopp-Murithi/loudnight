import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { adDesignSchema, type AdDesign } from "@/modules/promote/promote.schemas"
import { promoteService } from "@/modules/promote/promote.service"

type Params = { id: string }

// Owners and managers save the look of a night's ad. RLS refuses everyone else.
export const PUT = apiRoute<AdDesign, Params>(
  { body: adDesignSchema, rateLimit: RATE_LIMITS.seriesEdit },
  async ({ ctx, params, body }) => {
    await promoteService.saveDesign(ctx, params.id, body)
    return { saved: true }
  },
)
