import { apiRoute } from "@/lib/http/route"
import { runsService } from "@/modules/runs/runs.service"

type Params = { runId: string }

export const maxDuration = 60

// Owners and managers; made once per plan and stored, so repeat calls only read it back.
export const POST = apiRoute<undefined, Params>({}, async ({ ctx, params }) => runsService.generic(ctx, params.runId))
