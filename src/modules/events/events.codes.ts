// Check-in codes: 12 characters nobody misreads at a door (no 0, o, 1, l or i), about 59 bits, from the platform's
// random source. The code is the ticket's secret. The last of 32 slots repeats a digit so a byte maps by a mask.
const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz9"
const CODE = /^[2-9a-hjkmnp-z]{12}$/
const PREFIX = "encore:checkin:"

export function checkinCode(random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes)) {
  return [...random(new Uint8Array(12))].map((byte) => ALPHABET[byte & 31]).join("")
}

export const isCheckinCode = (value: string) => CODE.test(value)

// What the ticket's QR holds. Scanning it at the door yields the code and nothing else.
export const ticketPayload = (code: string) => `${PREFIX}${code}`

// The door accepts the QR text, the ticket's link, or the code typed by hand, in any case and with stray spaces.
export function codeFrom(scanned: string): string | null {
  const text = scanned.trim().toLowerCase()
  const candidate = text.startsWith(PREFIX)
    ? text.slice(PREFIX.length)
    : text.includes("/ticket/")
      ? (text.split("/ticket/")[1]?.split(/[/?#]/)[0] ?? "")
      : text.replace(/\s+/g, "")
  return isCheckinCode(candidate) ? candidate : null
}
