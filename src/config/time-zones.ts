// Venues can be anywhere. The zone comes from the venue's Google place; owners can correct it in settings.
export const DEFAULT_TIME_ZONE = "America/New_York"

// Any zone the runtime knows, such as "Africa/Nairobi" or "Europe/London".
export function isTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.length > 64) return false
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value })
    return true
  } catch {
    return false
  }
}

// Every zone for the settings picker. Older runtimes without the list fall back to the venue's own zone.
export function allTimeZones(current: string): string[] {
  const known = typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []
  return known.includes(current) ? known : [current, ...known]
}

// "Africa/Nairobi" reads as "Nairobi (GMT+3)", the way an owner would say it.
export function zoneLabel(zone: string, at = new Date()): string {
  const place = zone.split("/").pop()?.replaceAll("_", " ") ?? zone
  const offset = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "shortOffset" })
    .formatToParts(at)
    .find((part) => part.type === "timeZoneName")?.value
  return offset ? `${place} (${offset})` : place
}
