// A ticket works only on the night: from the start of the night's own day, in the venue's time, until this many hours
// after it begins. The database refuses any check-in outside the same window.
export const DOOR_OPEN_HOURS = 8
const HOUR = 3_600_000

export type DoorWindow = "early" | "open" | "over"

const localDay = (at: Date, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at)

export function doorWindow(startsAt: string, timeZone: string, now: Date): DoorWindow {
  const starts = new Date(startsAt)
  if (now.getTime() > starts.getTime() + DOOR_OPEN_HOURS * HOUR) return "over"
  return localDay(now, timeZone) < localDay(starts, timeZone) ? "early" : "open"
}
