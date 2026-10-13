import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { chooseConcept } from "@/modules/concepts/concepts.read"

type Params = { id: string }

// Owners and managers only; the database refuses door staff, guests and previews.
export const POST = apiRoute<undefined, Params>({ rateLimit: RATE_LIMITS.chooseConcept }, async ({ ctx, params }) => {
  await chooseConcept(ctx, params.id)
  return { chosen: true }
})
