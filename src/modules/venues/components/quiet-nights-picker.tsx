"use client"

import { ArrowDown, ArrowUp } from "lucide-react"
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form"
import { IconButton } from "@/components/shared/icon-button"
import { FieldDescription, FieldError, FieldLegend, FieldSet } from "@/components/ui/field"
import { QUIET_NIGHTS_MAX, WEEKDAY_LABELS, WEEKDAYS, type Weekday } from "@/config/venues"
import { moveNight, toggleNight } from "../venues.nights"
import { chip } from "./venue-fields"

export function QuietNightsPicker<T extends FieldValues>({ control, name }: { control: Control<T>; name: Path<T> }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const nights: Weekday[] = field.value ?? []
        const full = nights.length >= QUIET_NIGHTS_MAX
        return (
          <FieldSet>
            <FieldLegend>Which nights are quiet?</FieldLegend>
            <FieldDescription>Choose up to {QUIET_NIGHTS_MAX}. Loudnight plans the first one first.</FieldDescription>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => {
                const picked = nights.includes(day)
                return (
                  <button
                    key={day}
                    type="button"
                    aria-pressed={picked}
                    disabled={!picked && full}
                    onClick={() => field.onChange(toggleNight(nights, day))}
                    className={chip}
                  >
                    {WEEKDAY_LABELS[day]}
                  </button>
                )
              })}
            </div>
            {nights.length > 1 && (
              <ol aria-label="Your quiet nights, in order" className="grid gap-1 sm:max-w-sm">
                {nights.map((night, index) => (
                  <li key={night} className="flex items-center gap-2 bg-muted/60 py-1 pr-1 pl-3 text-sm">
                    <span className="w-5 text-muted-foreground tabular-nums">{index + 1}</span>
                    <span className="min-w-0 flex-1 font-medium">{WEEKDAY_LABELS[night]}</span>
                    <IconButton
                      label={`Move ${WEEKDAY_LABELS[night]} up`}
                      disabled={index === 0}
                      onClick={() => field.onChange(moveNight(nights, index, -1))}
                    >
                      <ArrowUp aria-hidden className="size-4" />
                    </IconButton>
                    <IconButton
                      label={`Move ${WEEKDAY_LABELS[night]} down`}
                      disabled={index === nights.length - 1}
                      onClick={() => field.onChange(moveNight(nights, index, 1))}
                    >
                      <ArrowDown aria-hidden className="size-4" />
                    </IconButton>
                  </li>
                ))}
              </ol>
            )}
            <FieldError errors={[fieldState.error]} />
          </FieldSet>
        )
      }}
    />
  )
}
