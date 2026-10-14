import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { checklistSchema, type ChecklistInput } from "@/modules/readiness/readiness.build"
import { readinessService } from "@/modules/readiness/readiness.service"

type Params = { id: string }

// Owners and managers tick off a night's logistics. RLS refuses everyone else.
export const PUT = apiRoute<ChecklistInput, Params>(
  { body: checklistSchema, rateLimit: RATE_LIMITS.seriesEdit },
  async ({ ctx, params, body }) => {
    await readinessService.saveChecklist(ctx, params.id, body)
    return { saved: true }
  },
)
