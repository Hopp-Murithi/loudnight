"use client"

import { useState } from "react"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatMoney, formatNightDate } from "@/lib/format"
import type { NightResult } from "../door.results"
import { useLogSpend } from "../hooks/use-log-spend"

function SpendEntry({ night, currency }: { night: NightResult; currency: string }) {
  const save = useLogSpend(night.id)
  const [amount, setAmount] = useState("")
  const id = `spend-${night.id}`
  return (
    <form
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        const value = Number(amount)
        if (amount.trim() !== "" && Number.isFinite(value) && value >= 0) save.mutate(value)
      }}
    >
      <div className="space-y-1">
        <Label htmlFor={id} className="text-xs">
          What the night took, in {currency}
        </Label>
        <Input
          id={id}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="w-40"
        />
      </div>
      <Button type="submit" variant="outline" disabled={save.isPending}>
        {night.numbers.takingsLogged ? "Correct it" : "Save"}
      </Button>
    </form>
  )
}

// One row per published night: who saved a place, who came, break-even, and what it took.
export function NightResults({
  nights,
  currency,
  timeZone,
}: {
  nights: NightResult[]
  currency: string
  timeZone: string
}) {
  return (
    <ul className="space-y-3">
      {nights.map((night) => {
        const { numbers } = night
        return (
          <li key={night.id} className="grid gap-4 border bg-card p-5 md:grid-cols-[1fr_auto] md:items-end">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-medium">{night.title}</h3>
                <span className="text-sm text-muted-foreground">{formatNightDate(night.startsAt, timeZone)}</span>
                {night.status === "cancelled" && <ToneBadge tone="neutral" label="Cancelled" />}
                {night.status !== "cancelled" && numbers.arrived > 0 && numbers.toBreakEven === 0 && (
                  <ToneBadge tone="success" label="Broke even" />
                )}
              </div>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-muted-foreground">Saved places</dt>
                  <dd className="tabular-nums">{numbers.rsvps}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Came in</dt>
                  <dd className="tabular-nums">{numbers.arrived}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">RSVPs here</dt>
                  <dd className="tabular-nums">
                    {numbers.showUpRate === null ? "None" : `${Math.round(numbers.showUpRate * 100)}%`}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{numbers.takingsLogged ? "Took" : "Took, estimated"}</dt>
                  <dd className="tabular-nums">{formatMoney(numbers.takingsCents, currency)}</dd>
                </div>
              </dl>
            </div>
            {night.status !== "cancelled" && <SpendEntry night={night} currency={currency} />}
          </li>
        )
      })}
    </ul>
  )
}
