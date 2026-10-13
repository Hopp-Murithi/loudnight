import { RATE_LIMITS } from "@/config/limits"
import { publicApiRoute } from "@/lib/http/route"
import { readStepReceipt } from "@/modules/runs/runs.read"

type Params = { stepId: string }

// Public for demo runs; RLS on run steps decides first, then only the first few results are returned.
export const GET = publicApiRoute<undefined, Params>(
  { rateLimit: RATE_LIMITS.receipts },
  async ({ supabase, params }) => readStepReceipt(supabase, params.stepId),
)
