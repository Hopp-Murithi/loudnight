import { RATE_LIMITS } from "@/config/limits"
import { publicApiRoute } from "@/lib/http/route"
import { readTalentReceipt } from "@/modules/talent/talent.read"

type Params = { id: string }

// Public for demo plans; RLS on talent candidates decides first, then only the cited slice of the answer is returned.
export const GET = publicApiRoute<undefined, Params>(
  { rateLimit: RATE_LIMITS.receipts },
  async ({ supabase, params }) => readTalentReceipt(supabase, params.id),
)
