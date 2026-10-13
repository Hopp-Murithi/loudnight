import { z } from "zod"
import type { VenueRole } from "@/config/navigation"

// The owner row is created with the venue and never changes hands here.
export const INVITABLE_ROLES = ["manager", "door"] as const satisfies readonly VenueRole[]

export const VENUE_ROLE_LABELS: Record<VenueRole, string> = {
  owner: "Owner",
  manager: "Manager",
  door: "Door staff",
}

export const inviteSchema = z.object({
  email: z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase()),
  role: z.enum(INVITABLE_ROLES, { error: "Choose a role." }),
})

export const changeRoleSchema = z.object({ role: z.enum(INVITABLE_ROLES) })

export type InviteInput = z.infer<typeof inviteSchema>
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>

export interface TeamMember {
  userId: string
  name: string
  email: string | null
  role: VenueRole
  isYou: boolean
}

export interface InviteResult {
  status: "added" | "invited"
}
