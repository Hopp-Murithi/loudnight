// Day-one Qloo gate (plan 02). Prints counts, latency and field paths; full responses go to .probe/, which git ignores.
import { mkdirSync, writeFileSync } from "node:fs"

const BASE = process.env.QLOO_API_URL || "https://hackathon.api.qloo.com"
const KEY = process.env.QLOO_API_KEY ?? ""
const OUT = ".probe"

const AREAS = [
  {
    id: "williamsburg",
    point: "POINT(-73.9575 40.7174)",
    latLng: "40.7174,-73.9575",
    locality: "Williamsburg, Brooklyn",
  },
  { id: "east-austin", point: "POINT(-97.7296 30.2624)", latLng: "30.2624,-97.7296", locality: "East Austin" },
  {
    id: "logan-square",
    point: "POINT(-87.7086 41.9292)",
    latLng: "41.9292,-87.7086",
    locality: "Logan Square, Chicago",
  },
]

const TYPES = [
  "urn:entity:artist",
  "urn:entity:book",
  "urn:entity:brand",
  "urn:entity:destination",
  "urn:entity:movie",
  "urn:entity:person",
  "urn:entity:place",
  "urn:entity:podcast",
  "urn:entity:tv_show",
  "urn:entity:video_game",
  "urn:tag",
]

type Params = Record<string, string>
type Area = (typeof AREAS)[number]

const FORMS: Record<string, (area: Area) => Params> = {
  point: (area) => ({ "signal.location": area.point }),
  "point+2km": (area) => ({ "signal.location": area.point, "signal.location.radius": "2000" }),
  query: (area) => ({ "signal.location.query": area.locality }),
  "filter.location": (area) => ({ "filter.location": area.latLng, "filter.location.radius": "2000" }),
}

interface ProbeRow {
  label: string
  status: number
  count: number
  ms: number
  keys: string
  affinity: string
}

const latencies: number[] = []

function findPath(value: unknown, key: string, path = "$"): string | null {
  if (value === null || typeof value !== "object") return null
  for (const [name, child] of Object.entries(value)) {
    const here = Array.isArray(value) ? `${path}[${name}]` : `${path}.${name}`
    if (name === key) return here
    const deeper = findPath(child, key, here)
    if (deeper) return deeper
  }
  return null
}

function resultsOf(body: unknown): unknown[] {
  if (body === null || typeof body !== "object") return []
  const results = (body as { results?: unknown }).results
  if (Array.isArray(results)) return results
  if (results && typeof results === "object") {
    const lists = Object.values(results).filter(Array.isArray)
    return lists.length > 0 ? (lists[0] as unknown[]) : []
  }
  return []
}

async function probe(label: string, path: string, params: Params): Promise<ProbeRow> {
  const started = performance.now()
  const response = await fetch(`${BASE}${path}?${new URLSearchParams(params)}`, {
    headers: { "X-Api-Key": KEY, Accept: "application/json" },
  })
  const ms = Math.round(performance.now() - started)
  latencies.push(ms)
  const body: unknown = await response.json().catch(() => null)
  writeFileSync(
    `${OUT}/${label.replace(/[^a-z0-9.+-]+/gi, "_")}.json`,
    JSON.stringify({ path, params, status: response.status, body }, null, 2),
  )
  const results = resultsOf(body)
  const first = results[0]
  return {
    label,
    status: response.status,
    count: results.length,
    ms,
    keys: first && typeof first === "object" ? Object.keys(first).join(",") : "",
    affinity: findPath(first, "affinity") ?? "",
  }
}

function print(row: ProbeRow) {
  const cells = [
    row.label.padEnd(52),
    String(row.status).padEnd(4),
    String(row.count).padStart(3),
    `${row.ms}ms`.padStart(7),
    row.affinity.padEnd(22),
    row.keys,
  ]
  console.log(cells.join("  "))
}

// Round two: the fixes the first round pointed to (popularity caps, WKT filters, demographics from an interest).
async function refine() {
  for (const area of AREAS) {
    for (const max of ["0.9", "0.7"]) {
      print(
        await probe(`${area.id} artist point pop<=${max}`, "/v2/insights", {
          "filter.type": "urn:entity:artist",
          "signal.location": area.point,
          "filter.popularity.max": max,
          take: "20",
        }),
      )
    }
    print(
      await probe(`${area.id} artist point trends`, "/v2/insights", {
        "filter.type": "urn:entity:artist",
        "signal.location": area.point,
        "bias.trends": "high",
        take: "20",
      }),
    )
    print(
      await probe(`${area.id} place filter.location wkt 2km`, "/v2/insights", {
        "filter.type": "urn:entity:place",
        "filter.location": area.point,
        "filter.location.radius": "2000",
        take: "20",
      }),
    )
    print(
      await probe(`${area.id} place filter.location wkt 2km bar`, "/v2/insights", {
        "filter.type": "urn:entity:place",
        "filter.location": area.point,
        "filter.location.radius": "2000",
        "filter.tags": "urn:tag:genre:place:bar",
        take: "20",
      }),
    )
    print(
      await probe(`${area.id} place wkt 2km signal point`, "/v2/insights", {
        "filter.type": "urn:entity:place",
        "filter.location": area.point,
        "filter.location.radius": "2000",
        "signal.location": area.point,
        take: "20",
      }),
    )
  }
  print(
    await probe("demographics afrobeats", "/v2/insights", {
      "filter.type": "urn:demographics",
      "signal.interests.tags": "urn:tag:genre:music:afrobeats",
    }),
  )
  print(
    await probe("demographics afrobeats williamsburg", "/v2/insights", {
      "filter.type": "urn:demographics",
      "signal.interests.tags": "urn:tag:genre:music:afrobeats",
      "signal.location": AREAS[0].point,
    }),
  )
  print(
    await probe("audiences communities", "/v2/audiences", {
      "filter.audience.types": "urn:audience:communities",
      take: "10",
    }),
  )
  print(
    await probe("artist audience-filtered williamsburg", "/v2/insights", {
      "filter.type": "urn:entity:artist",
      "signal.location": AREAS[0].point,
      "signal.interests.tags": "urn:tag:genre:music:afrobeats",
      take: "20",
    }),
  )
}

async function main() {
  if (!KEY) throw new Error("QLOO_API_KEY is missing from .env.local")
  mkdirSync(OUT, { recursive: true })
  console.log(
    ["request".padEnd(52), "http", "  n", "latency".padStart(7), "affinity path".padEnd(22), "first result keys"].join(
      "  ",
    ),
  )
  if (process.argv.includes("--refine")) {
    await refine()
    return
  }

  for (const area of AREAS) {
    for (const type of TYPES) {
      for (const [form, build] of Object.entries(FORMS)) {
        if (form === "filter.location" && !["urn:entity:place", "urn:entity:destination"].includes(type)) continue
        print(
          await probe(`${area.id} ${type.replace("urn:entity:", "")} ${form}`, "/v2/insights", {
            "filter.type": type,
            take: "20",
            ...build(area),
          }),
        )
      }
    }
    print(
      await probe(`${area.id} tag genre:music point`, "/v2/insights", {
        "filter.type": "urn:tag",
        "filter.tag.types": "urn:tag:genre:music",
        "signal.location": area.point,
        take: "20",
      }),
    )
    print(
      await probe(`${area.id} tag cuisine point`, "/v2/insights", {
        "filter.type": "urn:tag",
        "filter.tag.types": "urn:tag:genre:place",
        "signal.location": area.point,
        take: "20",
      }),
    )
    print(
      await probe(`${area.id} artist point age 25_to_29`, "/v2/insights", {
        "filter.type": "urn:entity:artist",
        "signal.location": area.point,
        "signal.demographics.age": "25_to_29",
        take: "20",
      }),
    )
    print(
      await probe(`${area.id} demographics point`, "/v2/insights", {
        "filter.type": "urn:demographics",
        "signal.location": area.point,
      }),
    )
    print(
      await probe(`${area.id} heatmap point`, "/v2/insights", {
        "filter.type": "urn:heatmap",
        "filter.location": area.point,
        "signal.interests.tags": "urn:tag:genre:music:afrobeats",
      }),
    )
    print(
      await probe(`${area.id} artist explainability`, "/v2/insights", {
        "filter.type": "urn:entity:artist",
        "signal.location": area.point,
        "feature.explainability": "true",
        take: "5",
      }),
    )
  }

  print(
    await probe("search artist Burna Boy", "/search", { query: "Burna Boy", types: "urn:entity:artist", take: "5" }),
  )
  print(
    await probe("search place near williamsburg", "/search", {
      query: "bar",
      types: "urn:entity:place",
      "filter.location": "40.7174,-73.9575",
      "filter.radius": "1",
      take: "5",
    }),
  )
  print(await probe("tags afrobeats", "/v2/tags", { "filter.query": "afrobeats", take: "5" }))
  print(
    await probe("tags search afrobeats", "/v2/tags", {
      "filter.tag.types": "urn:tag:genre:music",
      "filter.query": "afro",
      take: "5",
    }),
  )
  print(await probe("audiences list", "/v2/audiences", { take: "10" }))
  print(await probe("audience types", "/v2/audiences/types", {}))

  const sorted = [...latencies].sort((a, b) => a - b)
  console.log(
    `\n${latencies.length} calls, p50 ${sorted[Math.floor(sorted.length / 2)]}ms, p95 ${sorted[Math.floor(sorted.length * 0.95)]}ms`,
  )
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
