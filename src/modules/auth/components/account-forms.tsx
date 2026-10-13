"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { LogOut } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { showApiError } from "@/components/forms/api-errors"
import { SubmitButton } from "@/components/forms/submit-button"
import { TextField } from "@/components/forms/text-field"
import { FieldGroup } from "@/components/ui/field"
import { updateAccountSchema, type UpdateAccountInput } from "../auth.schemas"
import { useLogout, useUpdateAccount } from "../hooks/use-auth-mutations"

export function AccountForm({ displayName }: { displayName: string }) {
  const update = useUpdateAccount()
  const { control, handleSubmit, setError } = useForm<UpdateAccountInput>({
    resolver: zodResolver(updateAccountSchema),
    defaultValues: { displayName },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit((values) =>
        update.mutate(values, {
          onSuccess: () => toast.success("Name saved"),
          onError: (error) => showApiError(error, setError),
        }),
      )}
    >
      <FieldGroup>
        <TextField control={control} name="displayName" label="Your name" autoComplete="name" />
        <SubmitButton pending={update.isPending} pendingLabel="Saving" className="self-start">
          Save name
        </SubmitButton>
      </FieldGroup>
    </form>
  )
}

export function SignOutButton() {
  const logout = useLogout()
  return (
    <SubmitButton
      type="button"
      variant="outline"
      pending={logout.isPending || logout.isSuccess}
      pendingLabel="Signing out"
      onClick={() => logout.mutate()}
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </SubmitButton>
  )
}
