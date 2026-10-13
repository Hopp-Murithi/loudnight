import { RATE_LIMITS } from "@/config/limits"
import { validationFailed } from "@/lib/http/errors"
import { apiStreamRoute } from "@/lib/http/route"
import { stepParamSchema } from "@/modules/runs/runs.schemas"
import { runsService } from "@/modules/runs/runs.service"

type Params = { runId: string; step: string }

export const maxDuration = 120

// One pipeline step per request, streamed. Owners and managers only; the service checks the step order.
export const POST = apiStreamRoute<undefined, Params>(
  { rateLimit: RATE_LIMITS.runStep },
  async ({ ctx, params, request }) => {
    const step = stepParamSchema.safeParse(params.step)
    if (!step.success) throw validationFailed({ step: "Unknown step" })
    return runsService.streamStep(ctx, params.runId, step.data, request.signal)
  },
)
