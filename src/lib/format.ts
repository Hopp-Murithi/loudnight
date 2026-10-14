// Money is shown in the venue's own currency and every time in the venue's own time zone.
// Amounts are stored as hundredths of the currency, and shown as whole units: "$300", "KES 5,000", "£40", "¥3,000".
export function formatMoney(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(
    Math.round(cents / 100),
  )
}

const CURRENCY_NAMES = new Intl.DisplayNames(["en"], { type: "currency" })

// "KES" reads as "Kenyan Shilling".
export const currencyName = (code: string) => CURRENCY_NAMES.of(code) ?? code

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

// A time of day such as "8:14 PM" in the venue's time zone, so the server and every phone show the same time.
export const formatClock = (iso: string, timeZone: string) =>
  new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(iso))

export const formatPercent = (ratio: number) => `${Math.round(ratio * 100)}%`

export const plural = (count: number, one: string, many = `${one}s`) => `${count} ${count === 1 ? one : many}`

// A calendar date with no time, such as an event's local date "2026-10-13". Read at noon UTC so no zone shifts the day.
export function formatLocalDate(localDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" }).format(new Date(`${localDate}T12:00:00Z`))
}
