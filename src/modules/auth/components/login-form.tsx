"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MailWarning } from "lucide-react"
import Link from "next/link"
import { useForm } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
import { ROUTES } from "@/config/site"
import { ApiError } from "@/lib/http/client"
import { loginSchema, type LoginInput } from "../auth.schemas"
import { useLogin, useResendVerification } from "../hooks/use-auth-mutations"

const isUnverified = (error: unknown) => error instanceof ApiError && error.code === "email_not_verified"

export function LoginForm() {
  const login = useLogin()
  const resend = useResendVerification()
  const { control, handleSubmit, setError, getValues } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        login.mutate(values, {
          onError: (error) => {
            if (!isUnverified(error)) showApiError(error, setError)
          },
        }),
      )}
    >
      <FieldGroup>
        {isUnverified(login.error) && (
          <div role="alert" className="space-y-3 border border-warning/40 bg-warning/10 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium">
              <MailWarning className="size-4 shrink-0" aria-hidden />
              Confirm your email first
            </p>
            <p className="text-muted-foreground">Open the link we emailed you, or get a new one.</p>
            <SubmitButton
              type="button"
              variant="outline"
              pending={resend.isPending}
              pendingLabel="Sending the link"
              onClick={() => resend.mutate({ email: getValues("email") })}
            >
              Send the link again
            </SubmitButton>
          </div>
        )}
        <TextField control={control} name="email" label="Email" type="email" autoComplete="username" />
        <TextField control={control} name="password" label="Password" type="password" autoComplete="current-password" />
        <SubmitButton size="lg" pending={login.isPending || login.isSuccess} pendingLabel="Signing in">
          Sign in
        </SubmitButton>
        <Link href={ROUTES.forgotPassword} className="text-center text-sm text-link underline-offset-4 hover:underline">
          Forgot your password?
        </Link>
      </FieldGroup>
    </form>
  )
}
