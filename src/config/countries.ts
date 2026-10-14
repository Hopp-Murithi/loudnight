// Every country a venue can be in (ISO 3166 two-letter codes), named in English by the runtime and shown with its
// flag. The venue search looks only inside the chosen country.
const CODES =
  "AD AE AF AG AI AL AM AO AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CU CV CW CY CZ DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GT GU GW GY HK HN HR HT HU ID IE IL IM IN IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TG TH TJ TL TM TN TO TR TT TV TW TZ UA UG US UY UZ VA VC VE VG VI VN VU WF WS XK YE YT ZA ZM ZW".split(
    " ",
  )

export const DEFAULT_COUNTRY = "US"

const NAMES = new Intl.DisplayNames(["en"], { type: "region" })

// A flag emoji is the code's two letters as regional indicator symbols.
export const flagOf = (code: string) =>
  String.fromCodePoint(...[...code.toUpperCase()].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65))

export const countryName = (code: string) => NAMES.of(code.toUpperCase()) ?? code

export interface Country {
  code: string
  name: string
  flag: string
}

export const COUNTRIES: readonly Country[] = CODES.map((code) => ({
  code,
  name: countryName(code),
  flag: flagOf(code),
})).sort((a, b) => a.name.localeCompare(b.name))

export const isCountryCode = (value: unknown): value is string => typeof value === "string" && CODES.includes(value)

// The visitor's country from the request, if it is one we know; otherwise the default.
export const countryOr = (value: string | null | undefined) =>
  value && isCountryCode(value.toUpperCase()) ? value.toUpperCase() : DEFAULT_COUNTRY

// The kinds of place a venue usually is. Google allows five per search; everything else is the fallback.
export const VENUE_PLACE_TYPES = ["bar", "night_club", "restaurant", "cafe", "pub"] as const
