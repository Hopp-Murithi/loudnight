"use client"

import { useState } from "react"
import { SAMPLE_RECEIPTS } from "@/config/landing"
import { cn } from "@/lib/utils"
import { TYPE } from "@/lib/typography"

// Every chip on a concept opens the API result it came from. Here with sample values, so anyone can try it.
export function ReceiptExplorer() {
  const [selected, setSelected] = useState(0)
  const receipt = SAMPLE_RECEIPTS[selected]

  return (
    <section
      aria-labelledby="receipts-heading"
      className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-12"
    >
      <div className="space-y-3">
        <h2 id="receipts-heading" className={TYPE.h1}>
          No number without a receipt.
        </h2>
        <p className={TYPE.lead}>
          Encore never asks you to take its word. Tap any claim to see the Qloo or Ticketmaster result behind it. A
          claim with no result behind it is never shown.
        </p>
      </div>
      <div className="min-w-0 space-y-4">
        <div role="group" aria-label="Claims" className="flex flex-wrap gap-2">
          {SAMPLE_RECEIPTS.map((item, index) => (
            <button
              key={item.chip}
              type="button"
              aria-pressed={index === selected}
              aria-controls="receipt-panel"
              onClick={() => setSelected(index)}
              className={cn(
                "border px-3 py-1.5 text-left text-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                index === selected
                  ? "border-spotlight bg-spotlight/20 text-foreground"
                  : "border-border text-muted-foreground hover:border-spotlight/60 hover:text-foreground",
              )}
            >
              {item.chip}
            </button>
          ))}
        </div>
        <div
          id="receipt-panel"
          aria-live="polite"
          className="dark min-w-0 border border-sidebar-border bg-sidebar p-5 text-foreground sm:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium">{receipt.claim}</p>
            <span className="shrink-0 border px-2 py-0.5 text-xs text-muted-foreground">Sample</span>
          </div>
          <pre className="mt-4 overflow-x-auto font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground sm:text-sm">
            <span className="break-all text-spotlight">{receipt.request}</span>
            {"\n\n"}
            <span className="break-all">{receipt.response}</span>
          </pre>
        </div>
      </div>
    </section>
  )
}
