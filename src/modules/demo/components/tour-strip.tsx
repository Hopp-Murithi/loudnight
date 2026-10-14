"use client"

import { X } from "lucide-react"
import { IconButton } from "@/components/shared/icon-button"
import { useDismissed } from "../hooks/use-dismissed"

const HINTS = [
  { href: "#answers", text: "See what a normal AI says, then switch to Loudnight" },
  { href: "#answers", text: "Open any number to see the Qloo answer behind it" },
  { href: "#series", text: "See the four weeks and who could play them" },
]

// Three things worth trying, in order, for someone seeing Loudnight for the first time.
export function TourStrip() {
  const { dismissed, dismiss } = useDismissed("encore-demo-tour")
  if (dismissed) return null

  return (
    <aside aria-label="Three things to try" className="flex items-start gap-3 border bg-muted/50 p-4">
      <ol className="grid min-w-0 flex-1 gap-3 sm:grid-cols-3">
        {HINTS.map((hint, index) => (
          <li key={hint.text} className="flex min-w-0 gap-3 text-sm">
            <span className="font-display text-2xl leading-none font-bold text-primary tabular-nums">{index + 1}</span>
            <a href={hint.href} className="min-w-0 underline-offset-4 hover:underline">
              {hint.text}
            </a>
          </li>
        ))}
      </ol>
      <IconButton label="Hide these tips" onClick={dismiss}>
        <X aria-hidden className="size-4" />
      </IconButton>
    </aside>
  )
}
