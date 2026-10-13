import { publicApiRoute } from "@/lib/http/route"
import { readRun } from "@/modules/runs/runs.read"

type Params = { runId: string }

// Public so judges can watch demo runs; the caller's own client means RLS shows only readable venues.
export const GET = publicApiRoute<undefined, Params>({}, async ({ supabase, params }) =>
  readRun(supabase, params.runId),
)
