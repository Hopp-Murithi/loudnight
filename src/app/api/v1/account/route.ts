import { apiRoute } from "@/lib/http/route"
import { updateAccountSchema, type UpdateAccountInput } from "@/modules/auth/auth.schemas"
import { accountService } from "@/modules/account/account.service"

export const PATCH = apiRoute<UpdateAccountInput>({ body: updateAccountSchema }, async ({ ctx, body }) =>
  accountService.update(ctx, body),
)
