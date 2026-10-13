"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import type { UseMutationResult } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
import { emailOnlySchema, type EmailOnlyInput, type SentResult } from "../auth.schemas"

interface EmailRequestFormProps {
  mutation: UseMutationResult<SentResult, Error, EmailOnlyInput>
  submitLabel: string
  pendingLabel: string
  defaultEmail?: string
}

// One email field and a button: asks for a reset link or a new confirmation link.
export function EmailRequestForm({ mutation, submitLabel, pendingLabel, defaultEmail = "" }: EmailRequestFormProps) {
  const { control, handleSubmit, setError } = useForm<EmailOnlyInput>({
    resolver: zodResolver(emailOnlySchema),
    defaultValues: { email: defaultEmail },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        mutation.mutate(values, { onError: (error) => showApiError(error, setError) }),
      )}
    >
      <FieldGroup>
        <TextField control={control} name="email" label="Email" type="email" autoComplete="email" />
        <SubmitButton size="lg" pending={mutation.isPending} pendingLabel={pendingLabel}>
          {submitLabel}
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}
