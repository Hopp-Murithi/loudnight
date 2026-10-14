import { ROLES } from "@/config/roles"
import { apiRoute } from "@/lib/http/route"
import { setPreviewCookie } from "@/modules/preview/preview.cookie"
import { previewService, startPreviewSchema, type StartPreviewInput } from "@/modules/preview/preview.service"

// Administrators only: start reading Loudnight as someone else, read only, for up to an hour.
export const POST = apiRoute<StartPreviewInput>(
  { roles: [ROLES.administrator], body: startPreviewSchema },
  async ({ ctx, body }) => setPreviewCookie(await previewService.start(ctx, body.userId)),
)
