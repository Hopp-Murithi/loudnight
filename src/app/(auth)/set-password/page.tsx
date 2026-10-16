import type { Metadata } from "next"
import { AuthHeading } from "@/components/layout/auth-shell"
import { getPageContext } from "@/modules/auth/server/context"
import { SetPasswordForm } from "@/modules/auth/components/set-password-form"

export const metadata: Metadata = { title: "Choose a password" }

// Reached from a reset or invite link, which signs the person in first. Without a session it leads to sign in.
export default async function SetPasswordPage() {
  await getPageContext()
  return (
    <>
      <AuthHeading
        title="Choose a password"
        description="You will use it with your email to sign in to Loudnight, here and in the Loudnight Door app."
      />
      <SetPasswordForm />
    </>
  )
}
