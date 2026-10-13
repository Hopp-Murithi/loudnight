import { SERIES } from "@/config/series"
import { nextEvenings, zonedInstant, type Weekday } from "@/modules/gap/gap.weekdays"

const WEEK_MS = 7 * 24 * 60 * 60 * 1000
const two = (value: number) => String(value).padStart(2, "0")

export interface PlannedNight {
  localDate: string
  startsAt: Date
}

// A calendar date and a wall-clock time in the venue's zone, as a real instant.
export function instantFor(localDate: string, time: string, timeZone: string): Date {
  const [year, month, day] = localDate.split("-").map(Number)
  const [hour, minute] = time.split(":").map(Number)
  return zonedInstant(year, month, day, hour, timeZone, minute)
}

// The reverse, for the edit form: what the clock on the venue's wall reads at that instant.
export function localParts(instant: string | Date, timeZone: string): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(instant))
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? ""
  return {
    date: [value("year"), value("month"), value("day")].join("-"),
    time: [value("hour"), value("minute")].join(":"),
  }
}

// Four weekly nights starting next week, never tonight, at the usual start time in the venue's own zone.
export function seriesNights(weekday: Weekday, timeZone: string, from: Date): PlannedNight[] {
  const time = [two(SERIES.startHour), two(SERIES.startMinute)].join(":")
  return nextEvenings(weekday, timeZone, new Date(from.getTime() + WEEK_MS), SERIES.nights).map((evening) => ({
    localDate: evening.localDate,
    startsAt: instantFor(evening.localDate, time, timeZone),
  }))
}

const dashed = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")

// "low-light-tuesdays-tue-oct-20-3fa9": readable, and unique because the ending comes from the concept's own id.
export function nightSlug(name: string, localDate: string, conceptId: string): string {
  const words = dashed(dashed(name.normalize("NFKD")).slice(0, SERIES.slugNameMax))
  const when = dashed(
    new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }).format(
      new Date(localDate + "T12:00:00Z"),
    ),
  )
  const ending = conceptId
    .replace(/[^a-f0-9]/gi, "")
    .slice(0, 4)
    .toLowerCase()
  return [words || "night", when, ending].filter(Boolean).join("-")
}

// The copywriter may not state numbers: dates, times and fees are filled in by Encore from stored values.
export const hasDigits = (text: string) => /\d/.test(text)
