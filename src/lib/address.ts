// The city part of an address ("214 Bedford Ave, Brooklyn, NY 11249, USA" becomes "Brooklyn, NY"), as a person says it.
export const cityOf = (address: string) => address.split(",").slice(1, 3).join(",").replace(/\d{5}/, "").trim()

// The venue's town: the one stored from its Google place, else read from a US-style address (venues made before then).
export const townOf = (venue: { city: string | null; address: string }) => venue.city ?? cityOf(venue.address)

export interface AddressPart {
  longText?: string
  shortText?: string
  types: string[]
}

const part = (parts: readonly AddressPart[], type: string) => parts.find((entry) => entry.types.includes(type))

export function countryFromParts(parts: readonly AddressPart[]): string | null {
  const code = part(parts, "country")?.shortText?.toUpperCase()
  return code && /^[A-Z]{2}$/.test(code) ? code : null
}

// The town as people name it: "Nairobi", "Nyeri", "London", "Shibuya". US towns carry their state: "Brooklyn, NY".
export function cityFromParts(parts: readonly AddressPart[]): string | null {
  const town = ["locality", "postal_town", "sublocality_level_1", "administrative_area_level_2"]
    .map((type) => part(parts, type)?.longText)
    .find(Boolean)
  if (!town) return null
  const state = part(parts, "administrative_area_level_1")?.shortText
  return countryFromParts(parts) === "US" && state ? `${town}, ${state}` : town
}
