"use client"

import { Check } from "lucide-react"
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  VENUE_CAPABILITIES,
  VENUE_CAPABILITY_LABELS,
  WEEKDAY_LABELS,
  WEEKDAYS,
  type VenueCapability,
} from "@/config/venues"
import { cn } from "@/lib/utils"

interface FieldProps<T extends FieldValues> {
  control: Control<T>
  name: Path<T>
}

const chip =
  "inline-flex min-h-10 items-center gap-2 border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground"

export function NightPicker<T extends FieldValues>({ control, name }: FieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FieldSet>
          <FieldLegend>Which night is quiet?</FieldLegend>
          <div role="radiogroup" aria-label="Quiet night" className="flex flex-wrap gap-2">
            {WEEKDAYS.map((day) => (
              <button
                key={day}
                type="button"
                role="radio"
                aria-checked={field.value === day}
                onClick={() => field.onChange(day)}
                className={chip}
              >
                {WEEKDAY_LABELS[day]}
              </button>
            ))}
          </div>
          <FieldError errors={[fieldState.error]} />
        </FieldSet>
      )}
    />
  )
}

export function CapabilityPicker<T extends FieldValues>({ control, name }: FieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected: VenueCapability[] = field.value ?? []
        const toggle = (capability: VenueCapability) =>
          field.onChange(
            selected.includes(capability) ? selected.filter((item) => item !== capability) : [...selected, capability],
          )
        return (
          <FieldSet>
            <FieldLegend>What can the space host?</FieldLegend>
            <div className="flex flex-wrap gap-2">
              {VENUE_CAPABILITIES.map((capability) => (
                <button
                  key={capability}
                  type="button"
                  aria-pressed={selected.includes(capability)}
                  onClick={() => toggle(capability)}
                  className={chip}
                >
                  <Check className={cn("size-4", !selected.includes(capability) && "hidden")} aria-hidden />
                  {VENUE_CAPABILITY_LABELS[capability]}
                </button>
              ))}
            </div>
            <FieldError errors={[fieldState.error]} />
          </FieldSet>
        )
      }}
    />
  )
}
