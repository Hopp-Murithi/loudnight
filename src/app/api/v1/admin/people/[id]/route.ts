import { ROLES } from "@/config/roles"
import { apiRoute } from "@/lib/http/route"
import { personStatusSchema, type PersonStatusInput } from "@/modules/admin/admin.schemas"
import { adminService } from "@/modules/admin/admin.service"

// Administrators only: deactivate or reactivate a person.
export const PATCH = apiRoute<PersonStatusInput, { id: string }>(
  { roles: [ROLES.administrator], body: personStatusSchema },
  async ({ ctx, params, body }) => adminService.setPersonActive(ctx, params.id, body.active),
)
