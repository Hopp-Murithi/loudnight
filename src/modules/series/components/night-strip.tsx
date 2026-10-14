"use client"

import { Clock } from "lucide-react"
import { useState } from "react"
import { ToneBadge } from "@/components/shared/tone-badge"
import { Button } from "@/components/ui/button"
import { WEEK_NAMES } from "@/config/series"
import { formatLocalDate, formatNightTime } from "@/lib/format"
import type { NightView } from "../series.schemas"
import { NightPublish } from "@/modules/events/components/night-publish"
import { NightEditSheet } from "./night-edit-sheet"

interface NightStripProps {
  nights: NightView[]
  timeZone: string
  canEdit: boolean
}

// The four weeks: a strip across a laptop, a row to swipe on a phone. Each card is one night and its twist.
export function NightStrip({ nights, timeZone, canEdit }: NightStripProps) {
  const [editing, setEditing] = useState<NightView | null>(null)

  return (
    <>
      <ol className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0 lg:pb-0">
        {nights.map((night, index) => (
          <li
            key={night.id}
            className="poster-in flex w-[78%] shrink-0 snap-center flex-col gap-4 border bg-card p-5 sm:w-[44%] lg:w-auto"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <time dateTime={night.startsAt} className="leading-none">
                <span className="block text-sm text-muted-foreground">
                  {formatLocalDate(night.localDate, { weekday: "long" })},{" "}
                  {formatLocalDate(night.localDate, { month: "short" })}
                </span>
                <span className="font-display text-6xl font-extrabold">
                  {formatLocalDate(night.localDate, { day: "numeric" })}
                </span>
              </time>
              {night.status !== "draft" && (
                <ToneBadge
                  tone={night.status === "published" ? "success" : "neutral"}
                  label={night.status === "published" ? "Published" : "Cancelled"}
                />
              )}
            </div>
            <div className="space-y-1">
              <h3 className="font-medium">{WEEK_NAMES[night.sequence - 1]}</h3>
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock aria-hidden className="size-4" />
                {formatNightTime(night.startsAt, timeZone)}
              </p>
            </div>
            <p className="text-sm">{night.variation}</p>
            {canEdit && (
              <div className="mt-auto flex flex-wrap gap-2">
                {night.status === "draft" && (
                  <Button variant="outline" onClick={() => setEditing(night)}>
                    Edit
                    <span className="sr-only">{WEEK_NAMES[night.sequence - 1]}</span>
                  </Button>
                )}
                <NightPublish nightId={night.id} slug={night.slug} status={night.status} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <NightEditSheet night={editing} onClose={() => setEditing(null)} />
    </>
  )
}
