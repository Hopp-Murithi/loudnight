import { QUIET_NIGHTS_MAX, type Weekday } from "@/config/venues"

export const toggleNight = (nights: Weekday[], day: Weekday): Weekday[] => {
  if (nights.includes(day)) return nights.filter((night) => night !== day)
  return nights.length >= QUIET_NIGHTS_MAX ? nights : [...nights, day]
}

export const moveNight = (nights: Weekday[], index: number, by: -1 | 1): Weekday[] => {
  const target = index + by
  if (index < 0 || index >= nights.length || target < 0 || target >= nights.length) return nights
  const moved = [...nights]
  ;[moved[index], moved[target]] = [moved[target], moved[index]]
  return moved
}

// The night a page is about: the one asked for when the venue has it, otherwise the first.
export const nightOf = (nights: readonly Weekday[], requested: string | string[] | undefined): Weekday | undefined =>
  nights.find((night) => night === requested) ?? nights[0]
