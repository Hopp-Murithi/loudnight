"use client"

import { useState } from "react"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"

const WIDTHS = [390, 768, 1280, 1440] as const

// Renders the gallery again inside a frame of an exact width, so phone and tablet layouts can be checked on a desktop.
export function PreviewToolbar() {
  const [width, setWidth] = useState<number | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Preview width">
        <Button
          variant={width === null ? "default" : "outline"}
          size="sm"
          onClick={() => setWidth(null)}
          aria-pressed={width === null}
        >
          This window
        </Button>
        {WIDTHS.map((value) => (
          <Button
            key={value}
            variant={width === value ? "default" : "outline"}
            size="sm"
            aria-pressed={width === value}
            onClick={() => setWidth(value)}
          >
            {value}px
          </Button>
        ))}
        <ThemeToggle />
      </div>
      {width !== null && (
        <div className="overflow-x-auto border bg-muted p-3">
          <iframe
            title={`Gallery at ${width} pixels wide`}
            src="/dev/components?embed=1"
            style={{ width }}
            className="mx-auto block h-[80dvh] border bg-background"
          />
        </div>
      )}
    </div>
  )
}
