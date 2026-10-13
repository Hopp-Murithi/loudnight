import { z } from "zod"

const email = z.email("Enter a valid email address.").transform((value) => value.trim().toLowerCase())

export const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters.")
  .max(72, "Use 72 characters or fewer.")
  .regex(/[A-Za-z]/, "Include at least one letter.")
  .regex(/[0-9]/, "Include at least one number.")

export const displayNameSchema = z.string().trim().min(1, "Enter your name.").max(80, "Use 80 characters or fewer.")

export const signUpSchema = z.object({ displayName: displayNameSchema, email, password: passwordSchema })

export const loginSchema = z.object({ email, password: z.string().min(1, "Enter your password.") })

export const emailOnlySchema = z.object({ email })

export const setPasswordSchema = z.object({ password: passwordSchema })

export const updateAccountSchema = z.object({ displayName: displayNameSchema })

export const LINK_TYPES = ["signup", "magiclink", "recovery", "invite"] as const
export type LinkType = (typeof LINK_TYPES)[number]

export const confirmLinkSchema = z.object({
  token_hash: z.string().min(10).max(200),
  type: z.enum(LINK_TYPES),
})

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type EmailOnlyInput = z.infer<typeof emailOnlySchema>
export type SetPasswordInput = z.infer<typeof setPasswordSchema>
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>

export interface RedirectResult {
  redirectTo: string
}

export interface SentResult {
  sent: true
}
