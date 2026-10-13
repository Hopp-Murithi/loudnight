// Venues are in the US for now, so money is dollars and every time is shown in the venue's own time zone.
const MONEY = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })

export const formatMoney = (cents: number) => MONEY.format(Math.round(cents / 100))

export function formatNightDate(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone }).format(
    new Date(iso),
  )
}

export function formatNightTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(iso))
}

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

// A calendar date with no time, such as an event's local date "2026-10-13". Read at noon UTC so no zone shifts the day.
export function formatLocalDate(localDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${localDate}T12:00:00Z`))
}
