"use client"

import type { ReactNode } from "react"
import { AD_FORMATS, AD_PALETTES, type AdFormatId, type AdPaletteId } from "@/config/promote"
import { cn } from "@/lib/utils"

interface ChoiceProps {
  label: string
  hint?: string
  selected: boolean
  onSelect: () => void
  children: ReactNode
}

// One option in a picker: a small drawing of the thing itself, its name, and a clear selected state.
export function Choice({ label, hint, selected, onSelect, children }: ChoiceProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      title={hint}
      onClick={onSelect}
      className={cn(
        "flex min-w-0 flex-col items-center gap-2 border p-2.5 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        selected
          ? "border-primary bg-primary/8 font-medium text-foreground"
          : "text-muted-foreground hover:border-foreground/40",
      )}
    >
      {children}
      {label}
    </button>
  )
}

export function Group({ label, columns, children }: { label: string; columns: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">{label}</h3>
      <div role="radiogroup" aria-label={label} className={cn("grid gap-2", columns)}>
        {children}
      </div>
    </div>
  )
}

export function FormatPicker({ value, onChange }: { value: AdFormatId; onChange: (id: AdFormatId) => void }) {
  return (
    <Group label="Shape" columns="grid-cols-4">
      {AD_FORMATS.map((format) => (
        <Choice
          key={format.id}
          label={format.label}
          hint={format.hint}
          selected={value === format.id}
          onSelect={() => onChange(format.id)}
        >
          <span className="grid h-10 place-items-center">
            <span
              aria-hidden
              className="block border-2 border-current"
              style={{
                height: format.height >= format.width ? 36 : 20,
                aspectRatio: `${format.width} / ${format.height}`,
              }}
            />
          </span>
        </Choice>
      ))}
    </Group>
  )
}

export function PalettePicker({ value, onChange }: { value: AdPaletteId; onChange: (id: AdPaletteId) => void }) {
  return (
    <Group label="Colours" columns="grid-cols-4">
      {(Object.keys(AD_PALETTES) as AdPaletteId[]).map((id) => {
        const palette = AD_PALETTES[id]
        return (
          <Choice key={id} label={palette.label} selected={value === id} onSelect={() => onChange(id)}>
            <span aria-hidden className="flex h-8 w-full overflow-hidden">
              {[palette.ink, palette.field, palette.accent, palette.paper].map((colour) => (
                <span key={colour} className="flex-1" style={{ background: colour }} />
              ))}
            </span>
          </Choice>
        )
      })}
    </Group>
  )
}
