import { RATE_LIMITS } from "@/config/limits"
import { apiRoute } from "@/lib/http/route"
import { inviteSchema, type InviteInput } from "@/modules/team/team.schemas"
import { teamService } from "@/modules/team/team.service"

type Params = { id: string }

export const GET = apiRoute<undefined, Params>({}, async ({ ctx, params }) => teamService.list(ctx, params.id))

export const POST = apiRoute<InviteInput, Params>(
  { body: inviteSchema, rateLimit: RATE_LIMITS.invite },
  async ({ ctx, params, body }) => teamService.invite(ctx, params.id, body),
)
