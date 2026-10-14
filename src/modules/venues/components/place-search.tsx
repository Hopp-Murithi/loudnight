"use client"

import { MapPin, Search } from "lucide-react"
import { useId, useState } from "react"
import { Spinner } from "@/components/shared/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { countryName } from "@/config/countries"
import { zoneLabel } from "@/config/time-zones"
import { currencyName } from "@/lib/format"
import { ApiError } from "@/lib/http/client"
import { usePlaceSearch } from "../hooks/use-place-search"
import type { PlaceOption } from "../venues.schemas"
import { CountryPicker } from "./country-picker"

interface PlaceSearchProps {
  selected: PlaceOption | null
  onSelect: (place: PlaceOption) => void
  initialCountry: string
  error?: string
}

// Finds the venue on Google Maps, inside the country picked first, so its name, location, town, time zone and
// currency are filled in without typing them.
export function PlaceSearch({ selected, onSelect, initialCountry, error }: PlaceSearchProps) {
  const [country, setCountry] = useState(initialCountry)
  const [text, setText] = useState("")
  const { search, choose, picking } = usePlaceSearch(text, country, onSelect)
  const inputId = useId()
  const statusId = useId()
  const places = search.data?.places ?? []
  const where = countryName(country)

  const status = search.isFetching
    ? "Searching"
    : search.error instanceof ApiError
      ? search.error.message
      : text.trim().length >= 3 && search.isSuccess
        ? places.length === 0
          ? `Nothing by that name in ${where}. Try the name as it shows on Google Maps, or add the town.`
          : search.data?.broadened
            ? `No bar, club, restaurant or cafe by that name in ${where}, so here is every kind of place.`
            : `${places.length} ${places.length === 1 ? "place" : "places"} in ${where}`
        : ""

  return (
    <div className="space-y-4">
      <CountryPicker value={country} onChange={setCountry} />
      <div className="space-y-3">
        <Label htmlFor={inputId}>Search for your venue in {where}</Label>
        <div className="relative">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id={inputId}
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Its name as it shows on Google Maps"
            className="pl-9"
            autoComplete="off"
            aria-describedby={statusId}
            aria-invalid={Boolean(error)}
          />
          {search.isFetching && <Spinner className="absolute top-1/2 right-3 -translate-y-1/2" />}
        </div>
        <p id={statusId} aria-live="polite" className="text-sm text-muted-foreground">
          {status}
        </p>
        {places.length > 0 && (
          <ul className="divide-y border" aria-label="Places found">
            {places.map((place) => (
              <li key={place.placeId}>
                <button
                  type="button"
                  onClick={() => choose(place.placeId)}
                  disabled={picking !== null}
                  aria-pressed={selected?.googlePlaceId === place.placeId}
                  className="flex w-full min-w-0 items-start gap-3 p-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring disabled:opacity-70 aria-pressed:bg-accent"
                >
                  {picking === place.placeId ? (
                    <Spinner className="mt-0.5 shrink-0" />
                  ) : (
                    <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium">{place.name}</span>
                    <span className="block text-sm text-muted-foreground">
                      {[place.kind, place.detail].filter(Boolean).join(", ")}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {selected && (
          <p className="border-l-2 border-primary bg-muted/60 p-3 text-sm">
            <span className="font-medium">{selected.name}</span>
            <span className="block text-muted-foreground">{selected.address}</span>
            {selected.timeZone && selected.currency && (
              <span className="mt-1 block text-muted-foreground">
                Times in {zoneLabel(selected.timeZone)}, money in {currencyName(selected.currency)}. You can change both
                before saving.
              </span>
            )}
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </div>
  )
}
