import { publicApiRoute } from "@/lib/http/route"
import { listShortlist } from "@/modules/concepts/concepts.read"

type Params = { runId: string }

// Public so judges can read demo plans; the caller's own client means RLS shows only readable venues.
export const GET = publicApiRoute<undefined, Params>({}, async ({ supabase, params }) =>
  listShortlist(supabase, params.runId),
)
