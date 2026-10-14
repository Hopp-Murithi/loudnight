"use client"

import type { ReactNode } from "react"
import { AD_PALETTES, AD_TEMPLATES, type AdPalette, type AdPaletteId, type AdTemplateId } from "@/config/promote"
import { Choice, Group } from "./ad-pickers"

// A thumbnail of each layout, drawn in the chosen colourway so the owner sees the real combination.
const SKETCH: Record<AdTemplateId, (palette: AdPalette) => ReactNode> = {
  marquee: (palette) => (
    <span
      className="relative block h-full w-full"
      style={{ background: `linear-gradient(${palette.field}, ${palette.ink})` }}
    >
      <span className="absolute inset-x-1.5 bottom-4 h-2" style={{ background: palette.paper }} />
      <span className="absolute bottom-1.5 left-1.5 h-1.5 w-6" style={{ background: palette.accent }} />
    </span>
  ),
  block: (palette) => (
    <span className="relative block h-full w-full" style={{ background: palette.field }}>
      <span
        className="absolute inset-x-0 top-0 h-1/2"
        style={{ background: palette.ink, clipPath: "polygon(0 0, 100% 0, 100% 78%, 0 100%)" }}
      />
      <span className="absolute inset-x-1.5 bottom-4 h-2" style={{ background: palette.paper }} />
      <span className="absolute bottom-1.5 left-1.5 h-1.5 w-6 border" style={{ borderColor: palette.accent }} />
    </span>
  ),
  ticket: (palette) => (
    <span className="relative block h-full w-full" style={{ background: palette.paper }}>
      <span className="absolute top-1.5 left-1.5 h-4 w-3" style={{ background: palette.field }} />
      <span className="absolute inset-x-0 top-1/2 border-t border-dashed" style={{ borderColor: palette.ink }} />
      <span className="absolute inset-x-1.5 bottom-2.5 h-2" style={{ background: palette.ink }} />
    </span>
  ),
}

interface TemplatePickerProps {
  value: AdTemplateId
  palette: AdPaletteId
  onChange: (id: AdTemplateId) => void
}

export function TemplatePicker({ value, palette, onChange }: TemplatePickerProps) {
  return (
    <Group label="Layout" columns="grid-cols-3">
      {AD_TEMPLATES.map((template) => (
        <Choice
          key={template.id}
          label={template.label}
          hint={template.hint}
          selected={value === template.id}
          onSelect={() => onChange(template.id)}
        >
          <span aria-hidden className="block h-14 w-11 overflow-hidden">
            {SKETCH[template.id](AD_PALETTES[palette])}
          </span>
        </Choice>
      ))}
    </Group>
  )
}
