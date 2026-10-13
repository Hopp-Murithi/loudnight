"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
import { setPasswordSchema, type SetPasswordInput } from "../auth.schemas"
import { useSetPassword } from "../hooks/use-auth-mutations"

export function SetPasswordForm({ submitLabel = "Save my password" }: { submitLabel?: string }) {
  const setPassword = useSetPassword()
  const { control, handleSubmit, setError, reset } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    defaultValues: { password: "" },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        setPassword.mutate(values, {
          onSuccess: () => {
            toast.success("Password saved")
            reset()
          },
          onError: (error) => showApiError(error, setError),
        }),
      )}
    >
      <FieldGroup>
        <TextField
          control={control}
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          description="At least 10 characters, with a letter and a number."
        />
        <SubmitButton size="lg" pending={setPassword.isPending} pendingLabel="Saving">
          {submitLabel}
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}
