import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { outreachEditSchema, type OutreachEditInput } from "@/modules/series/series.schemas"
import { talentService } from "@/modules/talent/talent.service"

type Params = { id: string }

// Owners and managers reword an outreach message. Encore never sends it: the owner copies it and sends it themselves.
export const PATCH = apiRoute<OutreachEditInput, Params>(
  { body: outreachEditSchema, rateLimit: RATE_LIMITS.seriesEdit },
  async ({ ctx, params, body }) => {
    await talentService.editOutreach(ctx, params.id, body.message)
    return { saved: true }
  },
)
