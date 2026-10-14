"use client"

import { Check } from "lucide-react"
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  ATMOSPHERE_LABELS,
  ATMOSPHERES,
  VENUE_CAPABILITIES,
  VENUE_CAPABILITY_LABELS,
  VENUE_HOST_LABELS,
  VENUE_HOSTS,
  WEEKDAY_LABELS,
  WEEKDAYS,
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

function ChipPicker<T extends FieldValues, V extends string>({
  control,
  name,
  legend,
  options,
  labels,
}: FieldProps<T> & { legend: string; options: readonly V[]; labels: Record<V, string> }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected: V[] = field.value ?? []
        const toggle = (option: V) =>
          field.onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option])
        return (
          <FieldSet>
            <FieldLegend>{legend}</FieldLegend>
            <div className="flex flex-wrap gap-2">
              {options.map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={selected.includes(option)}
                  onClick={() => toggle(option)}
                  className={chip}
                >
                  <Check className={cn("size-4", !selected.includes(option) && "hidden")} aria-hidden />
                  {labels[option]}
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

export const CapabilityPicker = <T extends FieldValues>(props: FieldProps<T>) => (
  <ChipPicker
    {...props}
    legend="What does the room have?"
    options={VENUE_CAPABILITIES}
    labels={VENUE_CAPABILITY_LABELS}
  />
)

export const HostsPicker = <T extends FieldValues>(props: FieldProps<T>) => (
  <ChipPicker {...props} legend="What kind of nights does it suit?" options={VENUE_HOSTS} labels={VENUE_HOST_LABELS} />
)

export function AtmospherePicker<T extends FieldValues>({ control, name }: FieldProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <FieldSet>
          <FieldLegend>How do guests usually spend the night?</FieldLegend>
          <div role="radiogroup" aria-label="Atmosphere" className="flex flex-wrap gap-2">
            {ATMOSPHERES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={field.value === option}
                onClick={() => field.onChange(option)}
                className={chip}
              >
                {ATMOSPHERE_LABELS[option]}
              </button>
            ))}
          </div>
        </FieldSet>
      )}
    />
  )
}
