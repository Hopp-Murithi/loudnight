import { ROLES } from "@/config/roles"
import { apiRoute } from "@/lib/http/route"
import { suspendVenueSchema, type SuspendVenueInput } from "@/modules/admin/admin.schemas"
import { adminService } from "@/modules/admin/admin.service"

type Params = { id: string }

// Administrators only; the database also refuses anyone else and audits both.
export const POST = apiRoute<SuspendVenueInput, Params>(
  { roles: [ROLES.administrator], body: suspendVenueSchema },
  async ({ ctx, params, body }) => adminService.suspendVenue(ctx, params.id, body.reason),
)

export const DELETE = apiRoute<undefined, Params>({ roles: [ROLES.administrator] }, async ({ ctx, params }) =>
  adminService.liftVenue(ctx, params.id),
)
