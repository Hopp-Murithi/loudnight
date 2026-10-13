"use client"

import { useId, useState } from "react"
import { NIGHT_VALUE_DEFAULTS, NIGHT_VALUE_LIMITS, PLAN_PRICE } from "@/config/landing"
import { nightValue } from "@/lib/night-value"
import { TYPE } from "@/lib/typography"

const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

interface SliderProps {
  label: string
  value: number
  display: string
  limits: { min: number; max: number; step: number }
  onChange: (value: number) => void
}

function Slider({ label, value, display, limits, onChange }: SliderProps) {
  const id = useId()
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
        <output htmlFor={id} className="font-display text-3xl leading-none font-bold tabular-nums">
          {display}
        </output>
      </div>
      <input
        id={id}
        type="range"
        {...limits}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer accent-primary"
      />
    </div>
  )
}

// The pitch's unit logic, with the brief's own numbers as the starting point. It shows the maths, not a promise.
export function NightValueCalculator() {
  const [guests, setGuests] = useState<number>(NIGHT_VALUE_DEFAULTS.guests)
  const [spend, setSpend] = useState<number>(NIGHT_VALUE_DEFAULTS.spend)
  const { monthly, timesPlan } = nightValue({ guests, spend, nightsPerMonth: NIGHT_VALUE_DEFAULTS.nightsPerMonth })

  return (
    <section aria-labelledby="value-heading" className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
      <div className="space-y-3">
        <h2 id="value-heading" className={TYPE.h1}>
          What a full Tuesday is worth.
        </h2>
        <p className={TYPE.lead}>
          A quiet night costs the same rent, staff and stock as a busy one. Every extra guest is almost all margin.
        </p>
      </div>
      <div className="space-y-6 bg-muted/60 p-6 sm:p-8">
        <Slider
          label="Extra guests a night"
          value={guests}
          display={String(guests)}
          limits={NIGHT_VALUE_LIMITS.guests}
          onChange={setGuests}
        />
        <Slider
          label="Spend per guest"
          value={spend}
          display={dollars.format(spend)}
          limits={NIGHT_VALUE_LIMITS.spend}
          onChange={setSpend}
        />
        <div aria-live="polite" className="space-y-1 border-t pt-5">
          <p className="text-sm text-muted-foreground">Extra a month, over four weekly nights</p>
          <p className="font-display text-6xl leading-none font-extrabold text-primary tabular-nums">
            {dollars.format(monthly)}
          </p>
          <p className="text-sm text-muted-foreground">
            {timesPlan >= 1
              ? `About ${timesPlan} times the top plan, which is ${dollars.format(PLAN_PRICE.to)} a month.`
              : `Less than the top plan, which is ${dollars.format(PLAN_PRICE.to)} a month.`}{" "}
            Plans start at {dollars.format(PLAN_PRICE.from)}.
          </p>
        </div>
      </div>
    </section>
  )
}
