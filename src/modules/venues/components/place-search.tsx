"use client"

import { MapPin, Search } from "lucide-react"
import { useId, useState } from "react"
import { Spinner } from "@/components/shared/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { VENUE_TYPE_LABELS } from "@/config/venues"
import { ApiError } from "@/lib/http/client"
import { usePlaceSearch } from "../hooks/use-place-search"
import type { PlaceOption } from "../venues.schemas"

interface PlaceSearchProps {
  selected: PlaceOption | null
  onSelect: (place: PlaceOption) => void
  error?: string
}

// Finds the venue on Google Maps so its name, location and type are filled in without typing them.
export function PlaceSearch({ selected, onSelect, error }: PlaceSearchProps) {
  const [text, setText] = useState("")
  const search = usePlaceSearch(text)
  const inputId = useId()
  const statusId = useId()
  const results = search.data ?? []

  const status = search.isFetching
    ? "Searching"
    : search.error instanceof ApiError
      ? search.error.message
      : text.trim().length >= 3 && search.isSuccess
        ? `${results.length} ${results.length === 1 ? "place" : "places"} found`
        : ""

  return (
    <div className="space-y-3">
      <Label htmlFor={inputId}>Search for your venue</Label>
      <div className="relative">
        <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <Input
          id={inputId}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Venue name and city, for example The Copper Room Brooklyn"
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
      {results.length > 0 && (
        <ul className="divide-y border" aria-label="Places found">
          {results.map((place) => (
            <li key={place.googlePlaceId}>
              <button
                type="button"
                onClick={() => onSelect(place)}
                aria-pressed={selected?.googlePlaceId === place.googlePlaceId}
                className="flex w-full min-w-0 items-start gap-3 p-3 text-left hover:bg-muted focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring aria-pressed:bg-accent"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0">
                  <span className="block font-medium">{place.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {VENUE_TYPE_LABELS[place.venueType]}, {place.address}
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
        </p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
