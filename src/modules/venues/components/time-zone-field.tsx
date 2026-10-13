"use client"

import { useId } from "react"
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { TIME_ZONES } from "@/config/time-zones"

// A native select: it works the same with a keyboard, a screen reader and a phone's own picker.
export function TimeZoneField<T extends FieldValues>({ control, name }: { control: Control<T>; name: Path<T> }) {
  const id = useId()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>Time zone</FieldLabel>
          <select
            id={id}
            {...field}
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            {TIME_ZONES.map((zone) => (
              <option key={zone.value} value={zone.value}>
                {zone.label} ({zone.value})
              </option>
            ))}
          </select>
          <FieldDescription>Event times on your pages and posts use this zone.</FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
