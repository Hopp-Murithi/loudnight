import "server-only"
import { ROUTES, SIGNED_IN_HOME } from "@/config/site"
import { sendEmail } from "@/lib/email/mailer"
import { emailTemplates } from "@/lib/email/templates"
import { publicEnv } from "@/lib/env/public"
import { AppError, unauthorized } from "@/lib/http/errors"
import type { ServerSupabase } from "@/lib/supabase/server"
import { absoluteUrl, afterConfirm } from "./auth.links"
import type { LinkType, LoginInput, SignUpInput } from "./auth.schemas"
import { createAccountLink, createSignUpLink, findAccount } from "./server/identity"
import type { RequestContext } from "./types"

const appUrl = () => publicEnv.NEXT_PUBLIC_APP_URL

// Sign-up, reset and resend never reveal whether an address has an account; routes run them after responding.
export const authService = {
  async signUp({ displayName, email, password }: SignUpInput): Promise<void> {
    const link = await createSignUpLink(email, password, displayName)
    const message =
      link.status === "created"
        ? emailTemplates.verifyEmail({ name: displayName, url: link.url })
        : emailTemplates.accountExists({
            signInUrl: absoluteUrl(appUrl(), ROUTES.login),
            resetUrl: absoluteUrl(appUrl(), ROUTES.forgotPassword),
          })
    await sendEmail({ to: email, ...message })
  },

  async resendVerification(email: string): Promise<void> {
    const account = await findAccount(email)
    if (!account || account.confirmed) return
    const url = await createAccountLink(email, "magiclink")
    if (url) await sendEmail({ to: email, ...emailTemplates.verifyAgain({ url }) })
  },

  async sendPasswordReset(email: string): Promise<void> {
    const account = await findAccount(email)
    if (!account) return
    const url = await createAccountLink(email, "recovery")
    if (url) await sendEmail({ to: email, ...emailTemplates.passwordReset({ url }) })
  },

  async signIn(supabase: ServerSupabase, { email, password }: LoginInput): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (!error) return
    if (error.code === "email_not_confirmed") {
      throw new AppError("email_not_verified", "Confirm your email first. We can send the link again.")
    }
    throw unauthorized("Incorrect email or password.")
  },

  async signOut(supabase: ServerSupabase): Promise<void> {
    await supabase.auth.signOut()
  },

  // Returns where to go next, or null when the link was used, expired or invalid.
  async confirmLink(supabase: ServerSupabase, tokenHash: string, type: LinkType): Promise<string | null> {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
    return error ? null : afterConfirm(type)
  },

  async setPassword(ctx: RequestContext, password: string): Promise<string> {
    const { error } = await ctx.supabase.auth.updateUser({ password })
    if (error?.code === "same_password") {
      throw new AppError("validation_failed", "Choose a password you have not used here before.", {
        password: ["Choose a password you have not used here before."],
      })
    }
    if (error) throw new AppError("validation_failed", "That password cannot be used. Try another.")
    return SIGNED_IN_HOME
  },
}
