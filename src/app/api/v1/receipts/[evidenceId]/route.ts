import { RATE_LIMITS } from "@/config/limits"
import { publicApiRoute } from "@/lib/http/route"
import { readReceipt } from "@/modules/concepts/concepts.read"

type Params = { evidenceId: string }

// Public for demo plans; RLS on evidence decides first, then only the cited slice of the answer is returned.
export const GET = publicApiRoute<undefined, Params>(
  { rateLimit: RATE_LIMITS.receipts },
  async ({ supabase, params }) => readReceipt(supabase, params.evidenceId),
)
