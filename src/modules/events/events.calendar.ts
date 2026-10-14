// A night as a calendar entry. Times are written in UTC, so every calendar shows them on its owner's own clock,
// whatever the season.
export interface CalendarEvent {
  uid: string
  title: string
  description: string
  location: string
  url: string
  startsAt: string
  hours: number
}

const stamp = (date: Date) =>
  date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "")
const endOf = (event: CalendarEvent) => new Date(new Date(event.startsAt).getTime() + event.hours * 3_600_000)

// Commas, semicolons, backslashes and line breaks are escaped as the calendar format requires.
const escape = (text: string) =>
  text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n")

// Lines longer than 75 characters continue on the next line after a space, as calendars expect.
function fold(line: string): string {
  const parts: string[] = []
  for (let start = 0; start < line.length; start += 74) parts.push(line.slice(start, start + 74))
  return parts.join("\r\n ")
}

export function icsFile(event: CalendarEvent, now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loudnight//Event page//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${event.uid}@encore`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(new Date(event.startsAt))}`,
    `DTEND:${stamp(endOf(event))}`,
    `SUMMARY:${escape(event.title)}`,
    `DESCRIPTION:${escape(event.description)}`,
    `LOCATION:${escape(event.location)}`,
    `URL:${event.url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ]
  return lines.map(fold).join("\r\n") + "\r\n"
}

export function googleCalendarLink(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${stamp(new Date(event.startsAt))}/${stamp(endOf(event))}`,
    details: `${event.description}\n\n${event.url}`,
    location: event.location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}
