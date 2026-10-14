import { ROLES } from "@/config/roles"
import { apiRoute } from "@/lib/http/route"
import { adminVenueDetail } from "@/modules/admin/admin.detail"

// Administrators only: one venue's team, settings and activity for the console's detail panel.
export const GET = apiRoute<undefined, { id: string }>({ roles: [ROLES.administrator] }, async ({ ctx, params }) =>
  adminVenueDetail(ctx, params.id),
)
