import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { talentEditSchema, type TalentEditInput } from "@/modules/series/series.schemas"
import { talentService } from "@/modules/talent/talent.service"

type Params = { id: string }

// Owners and managers reword a message or mark an act as booked. Encore never sends anything to a performer.
export const PATCH = apiRoute<TalentEditInput, Params>(
  { body: talentEditSchema, rateLimit: RATE_LIMITS.seriesEdit },
  async ({ ctx, params, body }) => {
    await talentService.update(ctx, params.id, body)
    return { saved: true }
  },
)
