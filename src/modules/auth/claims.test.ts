import type { JwtPayload } from "@supabase/supabase-js"
import { describe, expect, it } from "vitest"
import { roleHintFromClaims } from "./claims"

const claims = (extra: Partial<JwtPayload>) => ({ sub: "u1", ...extra }) as JwtPayload

describe("roleHintFromClaims", () => {
  it("returns null without a session", () => {
    expect(roleHintFromClaims(null)).toBeNull()
  })

  it("treats a session without a role as an owner, anonymous visitors included", () => {
    expect(roleHintFromClaims(claims({ is_anonymous: true }))).toBe("owner")
  })

  it("reads the administrator role from app_metadata", () => {
    expect(roleHintFromClaims(claims({ app_metadata: { role: "administrator" } }))).toBe("administrator")
  })

  // user_metadata is editable by the user, so it must never grant a role.
  it("ignores a role in user_metadata", () => {
    expect(roleHintFromClaims(claims({ user_metadata: { role: "administrator" } }))).toBe("owner")
  })
})
