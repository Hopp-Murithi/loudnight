import { GAP } from "@/config/gap"
import type { Weekday } from "@/config/venues"

export type { Weekday }

const WEEKDAY_INDEX: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export interface EveningWindow {
  localDate: string
  start: Date
  end: Date
}

function zoneParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant)
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value)
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  }
}

// How far the zone is ahead of UTC at that instant, in milliseconds.
function zoneOffset(instant: Date, timeZone: string): number {
  const p = zoneParts(instant, timeZone)
  return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - instant.getTime()
}

// A local wall-clock time in the zone as a real instant. Checked twice so a DST change between guesses is caught.
export function zonedInstant(year: number, month: number, day: number, hour: number, timeZone: string): Date {
  const guess = Date.UTC(year, month - 1, day, hour)
  const first = guess - zoneOffset(new Date(guess), timeZone)
  return new Date(guess - zoneOffset(new Date(first), timeZone))
}

// The next `count` evenings of a weekday in the venue's own time zone. Today counts when it is that weekday.
export function nextEvenings(
  weekday: Weekday,
  timeZone: string,
  from: Date,
  count: number = GAP.nightsAhead,
): EveningWindow[] {
  const today = zoneParts(from, timeZone)
  const todayIndex = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay()
  const ahead = (WEEKDAY_INDEX[weekday] - todayIndex + 7) % 7

  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(today.year, today.month - 1, today.day + ahead + index * 7))
    const [year, month, day] = [date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()]
    const start = zonedInstant(year, month, day, GAP.eveningStartHour, timeZone)
    const end = zonedInstant(year, month, day + 1, (GAP.eveningStartHour + GAP.eveningHours) % 24, timeZone)
    return { localDate: date.toISOString().slice(0, 10), start, end }
  })
}

// Ticketmaster wants UTC without milliseconds.
export const ticketmasterTime = (instant: Date) => instant.toISOString().replace(/\.\d{3}Z$/, "Z")
