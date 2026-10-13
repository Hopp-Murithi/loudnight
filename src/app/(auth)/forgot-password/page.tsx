import type { Metadata } from "next"
import Link from "next/link"
import { AuthHeading } from "@/components/layout/auth-shell"
import { ROUTES } from "@/config/site"
import { ForgotPasswordForm } from "@/modules/auth/components/request-link-forms"

export const metadata: Metadata = { title: "Reset your password" }

export default function ForgotPasswordPage() {
  return (
    <>
      <AuthHeading
        title="Reset your password"
        description="Enter the email you sign in with. If it has an account, we will send a link to choose a new password."
      />
      <ForgotPasswordForm />
      <p className="text-center text-sm">
        <Link href={ROUTES.login} className="text-link underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
