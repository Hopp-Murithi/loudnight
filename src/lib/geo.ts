export interface LatLng {
  latitude: number
  longitude: number
}

const EARTH_RADIUS_M = 6_371_000
const radians = (degrees: number) => (degrees * Math.PI) / 180

// Great-circle distance in metres. Accurate to a few metres at neighbourhood scale.
export function distanceMetres(from: LatLng, to: LatLng): number {
  const dLat = radians(to.latitude - from.latitude)
  const dLng = radians(to.longitude - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a)))
}

// "350 m" under a kilometre, "1.4 km" above it.
export function formatDistance(metres: number): string {
  if (metres < 1000) return `${Math.round(metres / 10) * 10} m`
  return `${(metres / 1000).toFixed(1)} km`
}
