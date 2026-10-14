"use client"

import { useId } from "react"
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { NATIVE_SELECT } from "@/components/forms/native-select"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { CURRENCIES } from "@/config/currencies"
import { currencyName } from "@/lib/format"

// The currency every amount for this venue is shown in. Guessed from the country, changeable here.
export function CurrencyField<T extends FieldValues>({ control, name }: { control: Control<T>; name: Path<T> }) {
  const id = useId()
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>Currency</FieldLabel>
          <select id={id} {...field} className={NATIVE_SELECT}>
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {currencyName(code)} ({code})
              </option>
            ))}
          </select>
          <FieldDescription>Budgets, spend and takings are all shown in this currency.</FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
