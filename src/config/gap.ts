// What counts as competition for a night out. Primary types only: `includedTypes` also matched bakeries and diners.
export const COMPETING_PRIMARY_TYPES = [
  "bar",
  "cocktail_bar",
  "pub",
  "wine_bar",
  "night_club",
  "live_music_venue",
  "comedy_club",
  "karaoke",
  "lounge_bar",
  "brewpub",
  "sports_bar",
  "beer_garden",
] as const

export const GAP = {
  nightsAhead: 4,
  eveningStartHour: 17,
  eveningHours: 9,
  maxThemes: 12,
  maxEventsPerNight: 50,
  neutralNovelty: 0.5,
} as const
