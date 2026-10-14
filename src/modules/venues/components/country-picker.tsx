"use client"

import { Combobox } from "@base-ui/react/combobox"
import { ChevronDown } from "lucide-react"
import { useId } from "react"
import { Label } from "@/components/ui/label"
import { COUNTRIES, flagOf, type Country } from "@/config/countries"

interface CountryPickerProps {
  value: string
  onChange: (code: string) => void
}

const byCode = new Map(COUNTRIES.map((country) => [country.code, country]))

// Which country the venue is in, searchable as you type ("Ke" finds Kenya), with each country's flag.
export function CountryPicker({ value, onChange }: CountryPickerProps) {
  const id = useId()
  const selected = byCode.get(value) ?? null

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>Country</Label>
      <Combobox.Root
        items={COUNTRIES}
        autoHighlight
        value={selected}
        onValueChange={(country: Country | null) => country && onChange(country.code)}
        itemToStringLabel={(country: Country) => country.name}
        isItemEqualToValue={(item: Country, current: Country) => item.code === current.code}
      >
        <div className="relative">
          <span aria-hidden className="flag pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-base">
            {flagOf(value)}
          </span>
          <Combobox.Input
            id={id}
            placeholder="Type a country"
            onFocus={(event) => event.currentTarget.select()}
            className="h-9 w-full rounded-md border border-input bg-background pr-10 pl-10 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          />
          <Combobox.Trigger
            aria-label="Show all countries"
            className="absolute top-1/2 right-1 grid size-8 -translate-y-1/2 place-items-center text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <ChevronDown aria-hidden className="size-4" />
          </Combobox.Trigger>
        </div>
        <Combobox.Portal>
          <Combobox.Positioner sideOffset={4} className="z-50">
            <Combobox.Popup className="max-h-72 w-[var(--anchor-width)] overflow-y-auto border bg-popover py-1 text-sm text-popover-foreground shadow-lg">
              <Combobox.Empty className="px-3 py-2 text-muted-foreground">No country by that name</Combobox.Empty>
              <Combobox.List>
                {(country: Country) => (
                  <Combobox.Item
                    key={country.code}
                    value={country}
                    className="flex cursor-default items-center gap-2 px-3 py-2 outline-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-selected:font-medium"
                  >
                    <span aria-hidden className="flag">
                      {country.flag}
                    </span>
                    {country.name}
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  )
}
