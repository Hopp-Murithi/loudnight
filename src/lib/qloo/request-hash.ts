import { createHash } from "node:crypto"

export type QlooParams = Record<string, string | number | boolean | readonly (string | number)[]>

// Sorted keys and sorted list values, so the same question always maps to the same cache row.
export function canonicalQlooRequest(path: string, params: QlooParams): { path: string; params: QlooParams } {
  const sorted = Object.keys(params)
    .sort()
    .reduce<QlooParams>((result, key) => {
      const value = params[key]
      result[key] = Array.isArray(value) ? [...value].map(String).sort() : value
      return result
    }, {})
  return { path, params: sorted }
}

export function qlooRequestHash(path: string, params: QlooParams): string {
  return createHash("sha256")
    .update(JSON.stringify(canonicalQlooRequest(path, params)))
    .digest("hex")
}

export function toSearchParams(params: QlooParams): URLSearchParams {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) =>
    search.set(key, Array.isArray(value) ? value.join(",") : String(value)),
  )
  return search
}
