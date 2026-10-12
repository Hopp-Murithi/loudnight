import type { FieldValues, Path, UseFormSetError } from "react-hook-form"
import { toast } from "sonner"
import { ApiError } from "@/lib/http/client"

// Puts server validation messages next to their fields, and toasts anything else.
export function showApiError<T extends FieldValues>(error: unknown, setError?: UseFormSetError<T>) {
  if (!(error instanceof ApiError)) {
    toast.error("Something went wrong. Try again.")
    return
  }

  const fieldErrors = Object.entries(error.details ?? {})
  if (!setError || fieldErrors.length === 0) {
    toast.error(error.message)
    return
  }

  fieldErrors.forEach(([name, messages]) => setError(name as Path<T>, { message: messages[0] }))
}
