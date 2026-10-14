const COMPACT = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 })

// The overlap in words first, so an owner reads what it means before the number.
export function matchLabel(overlap: number): string {
  if (overlap >= 0.9) return "Very strong crowd match"
  if (overlap >= 0.75) return "Strong crowd match"
  return "Good crowd match"
}

// "Nairobi, Nairobi County, Kenya" reads as "Nairobi" on a card. The full place is in the contact sheet.
export const hometown = (origin: string | null) => origin?.split(",")[0]?.trim() || null

export const listenersText = (listeners: number | null) =>
  listeners && listeners > 0 ? `${COMPACT.format(listeners)} monthly listeners` : null

// Opens the owner's own mail app with the message ready. Encore has no address for the act, so the owner adds it.
export function mailtoLink(subject: string, body: string): string {
  return `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
