import { apiRoute } from "@/lib/http/route"
import { changeRoleSchema, type ChangeRoleInput } from "@/modules/team/team.schemas"
import { teamService } from "@/modules/team/team.service"

type Params = { id: string; userId: string }

export const PATCH = apiRoute<ChangeRoleInput, Params>({ body: changeRoleSchema }, async ({ ctx, params, body }) => {
  await teamService.changeRole(ctx, params.id, params.userId, body)
  return { saved: true }
})

export const DELETE = apiRoute<undefined, Params>({}, async ({ ctx, params }) => {
  await teamService.remove(ctx, params.id, params.userId)
  return { removed: true }
})
