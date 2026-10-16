"use client"

import { ShareButton } from "@/components/shared/share-button"
import { Button } from "@/components/ui/button"
import { downloadBlob, fileSlug } from "@/lib/download"
import { googleCalendarLink, icsFile, type CalendarEvent } from "../events.calendar"

// A night lasts about three hours on a guest's calendar.
const NIGHT_HOURS = 3

interface EventActionsProps {
  slug: string
  url: string
  title: string
  startsAt: string
  description: string
  location: string
}

// Add to calendar (a file for Apple and Outlook, a link for Google) and share.
export function EventActions({ slug, url, title, startsAt, description, location }: EventActionsProps) {
  const event: CalendarEvent = { uid: slug, title, description, location, url, startsAt, hours: NIGHT_HOURS }

  const saveFile = () =>
    downloadBlob(new Blob([icsFile(event)], { type: "text/calendar;charset=utf-8" }), `${fileSlug(title)}.ics`)

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" onClick={saveFile}>
        Add to calendar
      </Button>
      <Button
        variant="outline"
        nativeButton={false}
        render={<a href={googleCalendarLink(event)} target="_blank" rel="noreferrer" />}
      >
        Google Calendar
        <span className="sr-only">, opens in a new tab</span>
      </Button>
      <ShareButton url={url} title={title} text={`${title}, ${location}`} />
    </div>
  )
}
