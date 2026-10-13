"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
import { signUpSchema, type SignUpInput } from "../auth.schemas"
import { useSignUp } from "../hooks/use-auth-mutations"

export function SignUpForm() {
  const signUp = useSignUp()
  const { control, handleSubmit, setError } = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { displayName: "", email: "", password: "" },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) => signUp.mutate(values, { onError: (error) => showApiError(error, setError) }))}
    >
      <FieldGroup>
        <TextField control={control} name="displayName" label="Your name" autoComplete="name" />
        <TextField control={control} name="email" label="Email" type="email" autoComplete="email" />
        <TextField
          control={control}
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          description="At least 10 characters, with a letter and a number."
        />
        <SubmitButton size="lg" pending={signUp.isPending || signUp.isSuccess} pendingLabel="Creating your account">
          Create my account
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}
