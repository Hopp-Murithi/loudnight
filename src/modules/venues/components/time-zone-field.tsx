"use client"

import { useId, useMemo } from "react"
import { Controller, useWatch, type Control, type FieldValues, type Path } from "react-hook-form"
import { NATIVE_SELECT } from "@/components/forms/native-select"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { allTimeZones, zoneLabel } from "@/config/time-zones"

// A native select: it works the same with a keyboard, a screen reader and a phone's own picker.
export function TimeZoneField<T extends FieldValues>({ control, name }: { control: Control<T>; name: Path<T> }) {
  const id = useId()
  const current = String(useWatch({ control, name }) ?? "")
  const zones = useMemo(() => allTimeZones(current), [current])
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>Time zone</FieldLabel>
          <select id={id} {...field} className={NATIVE_SELECT}>
            {zones.map((zone) => (
              <option key={zone} value={zone}>
                {zone === current ? zoneLabel(zone) : zone.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <FieldDescription>
            Found from your venue&apos;s location. Event times on your pages and posts use it.
          </FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
