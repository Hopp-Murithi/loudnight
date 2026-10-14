import "server-only"
import { z } from "zod"
import { ROLES } from "@/config/roles"
import { conflict, notFound } from "@/lib/http/errors"
import { createAdminSupabase } from "@/lib/supabase/admin"
import type { RequestContext } from "@/modules/auth/types"
import { historyRepository } from "@/modules/history/history.repository"

export const startPreviewSchema = z.object({ userId: z.uuid() })
export type StartPreviewInput = z.infer<typeof startPreviewSchema>

export const previewService = {
  // Only an active non-administrator can be previewed; the database checks the same before honouring the header.
  async start(ctx: RequestContext, userId: string): Promise<string> {
    if (ctx.preview) throw conflict("Exit the current preview first.")
    if (userId === ctx.user.id) throw conflict("You cannot preview yourself.")
    const { data: target } = await ctx.supabase
      .from("profiles")
      .select("id, role, is_active")
      .eq("id", userId)
      .maybeSingle()
    if (!target) throw notFound("That person does not exist.")
    if (target.role === ROLES.administrator) throw conflict("Administrators cannot be previewed.")
    if (!target.is_active) throw conflict("Reactivate this person before previewing them.")
    await historyRepository.record(createAdminSupabase(), {
      actorId: ctx.user.id,
      action: "preview.started",
      subjectType: "profiles",
      subjectId: userId,
    })
    return userId
  },

  async end(ctx: RequestContext): Promise<void> {
    if (!ctx.preview) return
    await historyRepository.record(createAdminSupabase(), {
      actorId: ctx.preview.adminId,
      action: "preview.ended",
      subjectType: "profiles",
      subjectId: ctx.user.id,
    })
  },
}
