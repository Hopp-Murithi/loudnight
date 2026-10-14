import { REGION_MAPS, type RegionId } from "./landing-maps"

// The landing story zooms into the visitor's own part of the world. The country comes from the request (Vercel's
// IP country header); nothing about the visitor is stored. Anyone we cannot place sees the United States.

export interface LandingRegion {
  id: RegionId
  place: string
  // What an area there might love, in words. Illustration only: real plans show Qloo's answers with receipts.
  tastes: readonly string[]
  night: { name: string; when: string }
  anywhere: string
}

export const LANDING_REGIONS: Record<RegionId, LandingRegion> = {
  us: {
    id: "us",
    place: "the United States",
    tastes: ["Live soul", "Indie rock", "Natural wine", "Jazz brunch", "Comedy nights", "Go-go"],
    night: { name: "Soul Supper Club", when: "Thursdays at 8 PM, four weeks" },
    anywhere: "Brooklyn or Austin, Chicago or Nashville. Start with your address.",
  },
  kenya: {
    id: "kenya",
    place: "Kenya",
    tastes: ["Afropop", "Bongo flava", "Live soul", "Kenyan hip hop", "Rooftop nights", "Nyama choma"],
    night: { name: "Afro Soul Supper", when: "Thursdays at 8 PM, four weeks" },
    anywhere: "Nairobi or Nyeri, Mombasa or Kisumu. Start with your address.",
  },
  nigeria: {
    id: "nigeria",
    place: "Nigeria",
    tastes: ["Afrobeats", "Alte", "Highlife", "Amapiano", "Suya nights", "Gospel"],
    night: { name: "Highlife Supper", when: "Wednesdays at 8 PM, four weeks" },
    anywhere: "Lagos or Abuja, Ibadan or Port Harcourt. Start with your address.",
  },
  "south-africa": {
    id: "south-africa",
    place: "South Africa",
    tastes: ["Amapiano", "Jazz", "Deep house", "Kwaito", "Braai", "Gqom"],
    night: { name: "Amapiano Sundowner", when: "Sundays at 5 PM, four weeks" },
    anywhere: "Johannesburg or Cape Town, Durban or Pretoria. Start with your address.",
  },
  uk: {
    id: "uk",
    place: "the United Kingdom",
    tastes: ["UK garage", "Folk", "Quiz nights", "Jazz", "Drum and bass", "Comedy"],
    night: { name: "Garage Supper Club", when: "Tuesdays at 8 PM, four weeks" },
    anywhere: "London or Manchester, Glasgow or Bristol. Start with your address.",
  },
  germany: {
    id: "germany",
    place: "Germany",
    tastes: ["Techno", "Jazz", "Craft beer", "Indie", "Poetry slam", "Vinyl nights"],
    night: { name: "Vinyl Wednesdays", when: "Wednesdays at 8 PM, four weeks" },
    anywhere: "Berlin or Hamburg, Munich or Leipzig. Start with your address.",
  },
  france: {
    id: "france",
    place: "France",
    tastes: ["Jazz manouche", "Chanson", "Natural wine", "Electro", "Cinema clubs", "French rap"],
    night: { name: "Jazz Manouche Night", when: "Thursdays at 8 PM, four weeks" },
    anywhere: "Paris or Lyon, Marseille or Bordeaux. Start with your address.",
  },
  india: {
    id: "india",
    place: "India",
    tastes: ["Indie", "Sufi", "Stand-up", "Bollywood", "Craft beer", "Ghazal"],
    night: { name: "Sufi Thursdays", when: "Thursdays at 8 PM, four weeks" },
    anywhere: "Mumbai or Delhi, Bengaluru or Goa. Start with your address.",
  },
  japan: {
    id: "japan",
    place: "Japan",
    tastes: ["City pop", "Jazz kissa", "Vinyl", "Izakaya", "Techno", "Karaoke"],
    night: { name: "City Pop Night", when: "Tuesdays at 8 PM, four weeks" },
    anywhere: "Tokyo or Osaka, Kyoto or Fukuoka. Start with your address.",
  },
  brazil: {
    id: "brazil",
    place: "Brazil",
    tastes: ["Samba", "Forro", "MPB", "Bossa nova", "Choro", "Baile funk"],
    night: { name: "Samba de Roda", when: "Wednesdays at 8 PM, four weeks" },
    anywhere: "Sao Paulo or Rio, Salvador or Recife. Start with your address.",
  },
  mexico: {
    id: "mexico",
    place: "Mexico",
    tastes: ["Cumbia", "Son jarocho", "Mezcal", "Rock en espanol", "Sonidero", "Lucha libre"],
    night: { name: "Cumbia Thursdays", when: "Thursdays at 8 PM, four weeks" },
    anywhere: "Mexico City or Guadalajara, Monterrey or Oaxaca. Start with your address.",
  },
  australia: {
    id: "australia",
    place: "Australia",
    tastes: ["Pub rock", "Indie", "Trivia", "Jazz", "Natural wine", "Comedy"],
    night: { name: "Pub Rock Thursdays", when: "Thursdays at 8 PM, four weeks" },
    anywhere: "Sydney or Melbourne, Brisbane or Perth. Start with your address.",
  },
}

export const DEFAULT_REGION: RegionId = "us"

// Each country goes to the nearest story we have a map for.
const BY_COUNTRY: Record<string, RegionId> = {
  ...Object.fromEntries(["KE", "UG", "TZ", "RW", "BI", "ET", "SS", "SO"].map((code) => [code, "kenya"])),
  ...Object.fromEntries(["NG", "GH", "BJ", "TG", "CM", "SN", "CI", "SL", "LR", "GM"].map((code) => [code, "nigeria"])),
  ...Object.fromEntries(["ZA", "ZW", "BW", "NA", "MZ", "ZM", "LS", "SZ", "MW"].map((code) => [code, "south-africa"])),
  ...Object.fromEntries(["GB", "IE"].map((code) => [code, "uk"])),
  ...Object.fromEntries(
    ["DE", "AT", "CH", "NL", "BE", "LU", "PL", "CZ", "DK", "SE", "NO", "FI", "HU"].map((code) => [code, "germany"]),
  ),
  ...Object.fromEntries(["FR", "ES", "PT", "IT", "MC", "GR", "MA", "TN", "DZ"].map((code) => [code, "france"])),
  ...Object.fromEntries(["IN", "PK", "BD", "LK", "NP", "AE", "SA", "QA"].map((code) => [code, "india"])),
  ...Object.fromEntries(
    ["JP", "KR", "CN", "TW", "HK", "SG", "PH", "TH", "VN", "MY", "ID"].map((code) => [code, "japan"]),
  ),
  ...Object.fromEntries(["BR", "AR", "UY", "PY", "CL", "PE", "BO", "CO", "VE", "EC"].map((code) => [code, "brazil"])),
  ...Object.fromEntries(["MX", "GT", "HN", "SV", "NI", "CR", "PA", "CU", "DO"].map((code) => [code, "mexico"])),
  ...Object.fromEntries(["AU", "NZ"].map((code) => [code, "australia"])),
}

const isRegionId = (value: unknown): value is RegionId => typeof value === "string" && value in LANDING_REGIONS

// A region asked for by name (`/?region=kenya`, for demos) wins; otherwise the visitor's country decides.
export function regionFor(countryCode: string | null | undefined, asked?: unknown): LandingRegion {
  if (isRegionId(asked)) return LANDING_REGIONS[asked]
  const id = (countryCode && BY_COUNTRY[countryCode.toUpperCase()]) || DEFAULT_REGION
  return LANDING_REGIONS[id]
}

export const regionMap = (id: RegionId) => REGION_MAPS[id]
