"use client"

import { useForgotPassword, useResendVerification } from "../hooks/use-auth-mutations"
import { EmailRequestForm } from "./email-request-form"

export function ForgotPasswordForm() {
  const forgot = useForgotPassword()
  return <EmailRequestForm mutation={forgot} submitLabel="Email me a reset link" pendingLabel="Sending the link" />
}

export function ResendVerificationForm({ email }: { email?: string }) {
  const resend = useResendVerification()
  return (
    <EmailRequestForm
      mutation={resend}
      defaultEmail={email}
      submitLabel="Send the confirmation link again"
      pendingLabel="Sending the link"
    />
  )
}
