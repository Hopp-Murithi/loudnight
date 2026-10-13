import "server-only"
import { notFound } from "@/lib/http/errors"
import type { UpdateAccountInput } from "@/modules/auth/auth.schemas"
import type { RequestContext } from "@/modules/auth/types"
import { accountRepository } from "./account.repository"

export const accountService = {
  // Only the name is editable here; the role and status never change from a session (RLS and column grants).
  async update(ctx: RequestContext, input: UpdateAccountInput) {
    const displayName = await accountRepository.updateDisplayName(ctx.supabase, ctx.user.id, input.displayName)
    if (!displayName) throw notFound()
    return { displayName }
  },
}
