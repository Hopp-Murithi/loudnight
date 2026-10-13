"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { IconButton } from "@/components/shared/icon-button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

interface TextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
  label: string
  type?: "text" | "email" | "password" | "tel" | "number" | "date" | "time"
  autoComplete?: string
  placeholder?: string
  description?: string
  disabled?: boolean
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  autoComplete,
  placeholder,
  description,
  disabled,
}: TextFieldProps<T>) {
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === "password"

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
          <div className="relative">
            <Input
              {...field}
              value={field.value ?? ""}
              id={field.name}
              type={isPassword && revealed ? "text" : type}
              onChange={
                type === "number"
                  ? (event) => field.onChange(event.target.value === "" ? "" : Number(event.target.value))
                  : field.onChange
              }
              autoComplete={autoComplete}
              placeholder={placeholder}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
              className={isPassword ? "pr-10" : undefined}
            />
            {isPassword && (
              <IconButton
                label={revealed ? "Hide password" : "Show password"}
                aria-pressed={revealed}
                onClick={() => setRevealed((current) => !current)}
                className="absolute top-1/2 right-0.5 size-7 -translate-y-1/2 text-muted-foreground"
              >
                {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </IconButton>
            )}
          </div>
          {description && <FieldDescription>{description}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
