import "server-only"
import { publicEnv } from "@/lib/env/public"
import { AppError } from "@/lib/http/errors"
import { createAdminSupabase } from "@/lib/supabase/admin"
import { confirmLinkUrl } from "../auth.links"

// Allowed service-role uses (CLAUDE.md section 3). Supabase sends no email here; Encore sends its own through Resend.

export interface AccountLookup {
  id: string
  confirmed: boolean
}

type SignUpLink = { status: "created"; url: string } | { status: "exists" }

const appUrl = () => publicEnv.NEXT_PUBLIC_APP_URL

export async function findAccount(email: string): Promise<AccountLookup | null> {
  const admin = createAdminSupabase()
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email.toLowerCase()).maybeSingle()
  if (!profile) return null
  const { data } = await admin.auth.admin.getUserById(profile.id)
  return data.user ? { id: data.user.id, confirmed: Boolean(data.user.email_confirmed_at) } : null
}

// Creates the unconfirmed account and returns the link that confirms it, or says the address is taken.
export async function createSignUpLink(email: string, password: string, displayName: string): Promise<SignUpLink> {
  const { data, error } = await createAdminSupabase().auth.admin.generateLink({
    type: "signup",
    email,
    password,
    options: { data: { display_name: displayName } },
  })
  if (error?.code === "email_exists" || error?.code === "user_already_exists") return { status: "exists" }
  if (error || !data.properties?.hashed_token) {
    throw new AppError("internal", "The account could not be created.")
  }
  return { status: "created", url: confirmLinkUrl(appUrl(), data.properties.hashed_token, "signup") }
}

// A one-time link for an existing account: a fresh confirmation or a password reset. Null when there is none.
export async function createAccountLink(email: string, type: "magiclink" | "recovery"): Promise<string | null> {
  const { data, error } = await createAdminSupabase().auth.admin.generateLink({ type, email })
  if (error || !data.properties?.hashed_token) return null
  return confirmLinkUrl(appUrl(), data.properties.hashed_token, type)
}

// Creates an account for someone invited to a team, with a link to choose their password.
export async function createInvite(email: string): Promise<{ userId: string; url: string }> {
  const { data, error } = await createAdminSupabase().auth.admin.generateLink({ type: "invite", email })
  if (error || !data.user || !data.properties?.hashed_token) {
    throw new AppError("internal", "The invitation could not be created.")
  }
  return { userId: data.user.id, url: confirmLinkUrl(appUrl(), data.properties.hashed_token, "invite") }
}
