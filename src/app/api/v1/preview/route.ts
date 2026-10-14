import { apiRoute } from "@/lib/http/route"
import { clearPreviewCookie } from "@/modules/preview/preview.cookie"
import { previewService } from "@/modules/preview/preview.service"

// Anyone signed in may end a preview: during one the caller reads as the person previewed, so no role is required.
export const DELETE = apiRoute({ ignorePreview: true }, async ({ ctx }) => {
  await previewService.end(ctx)
  return clearPreviewCookie()
})
