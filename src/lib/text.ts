const DASHES = `[${String.fromCharCode(0x2013, 0x2014)}]`
const RANGE = new RegExp(String.raw`(\d)\s*${DASHES}\s*(\d)`, "g")
const LONG_DASH = new RegExp(String.raw`\s*${DASHES}\s*`, "g")

// Encore copy never shows long dashes, including text a model wrote: ranges read "8 to 11", the rest take a comma.
export const plainDashes = (text: string) => text.replace(RANGE, "$1 to $2").replace(LONG_DASH, ", ")

// "Sam Rivera" becomes "SR", for avatars.
export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("")
