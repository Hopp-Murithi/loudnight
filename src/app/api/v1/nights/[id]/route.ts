import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { nightEditSchema, type NightEditInput } from "@/modules/series/series.schemas"
import { seriesService } from "@/modules/series/series.service"

type Params = { id: string }

// Owners and managers change a draft night's date, time and twist. RLS refuses everyone else.
export const PATCH = apiRoute<NightEditInput, Params>(
  { body: nightEditSchema, rateLimit: RATE_LIMITS.seriesEdit },
  async ({ ctx, params, body }) => {
    await seriesService.updateNight(ctx, params.id, body)
    return { saved: true }
  },
)
