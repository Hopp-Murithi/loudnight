// The city part of an address ("214 Bedford Ave, Brooklyn, NY 11249, USA" becomes "Brooklyn, NY"), as a person says it.
export const cityOf = (address: string) => address.split(",").slice(1, 3).join(",").replace(/\d{5}/, "").trim()
