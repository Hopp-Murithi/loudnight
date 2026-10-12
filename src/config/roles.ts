import type { Enums } from "@/types/database"

export type AppRole = Enums<"app_role">

export const ROLES = {
  owner: "owner",
  administrator: "administrator",
} as const satisfies Record<string, AppRole>

export const ALL_ROLES: AppRole[] = Object.values(ROLES)

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && (ALL_ROLES as string[]).includes(value)
}
