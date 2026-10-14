"use client"

import { useId, useState } from "react"
import { VENUE_PLAN_PRICE } from "@/config/pricing"
import { formatMoney } from "@/lib/format"
import { monthlyGain, paysFor } from "../door.metrics"

interface GainCalculatorProps {
  currency: string
  averageSpendCents: number
  extraGuests: number
}

// "If this night adds N guests every week at S each": the pitch, worked in the owner's own numbers.
export function GainCalculator({ currency, averageSpendCents, extraGuests }: GainCalculatorProps) {
  const guestsId = useId()
  const spendId = useId()
  const [guests, setGuests] = useState(Math.max(1, extraGuests))
  const [spend, setSpend] = useState(Math.round(averageSpendCents / 100))
  const gain = monthlyGain(guests, spend * 100)
  const price = VENUE_PLAN_PRICE[currency]

  return (
    <section aria-labelledby="gain-heading" className="space-y-4 border bg-card p-5">
      <h2 id="gain-heading" className="font-medium">
        What a filled night is worth
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor={guestsId} className="text-sm">
            Extra guests each week: <span className="font-medium tabular-nums">{guests}</span>
          </label>
          <input
            id={guestsId}
            type="range"
            min={1}
            max={150}
            value={guests}
            onChange={(event) => setGuests(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor={spendId} className="text-sm">
            Spend per guest: <span className="font-medium tabular-nums">{formatMoney(spend * 100, currency)}</span>
          </label>
          <input
            id={spendId}
            type="range"
            min={1}
            max={Math.max(100, Math.round((averageSpendCents / 100) * 4))}
            value={spend}
            onChange={(event) => setSpend(Number(event.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </div>
      <p className="text-lg" aria-live="polite">
        That is <span className="font-display text-3xl font-bold tabular-nums">{formatMoney(gain, currency)}</span> a
        month, over four nights.
        {price ? ` It pays for Loudnight ${paysFor(gain, price)} times over.` : ""}
      </p>
    </section>
  )
}
