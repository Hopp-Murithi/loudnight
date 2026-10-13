// Day-one gate: proves every external service answers with the keys in .env.local. Prints no secrets.
// Run with `npm run check:connections`.

export {}

type Check = { name: string; run: () => Promise<string> }

const env = (name: string) => process.env[name]?.trim() ?? ""

async function expectOk(response: Response, describe: (body: unknown) => string): Promise<string> {
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return describe(await response.json().catch(() => null))
}

const checks: Check[] = [
  {
    name: "Supabase",
    run: async () => {
      const url = env("NEXT_PUBLIC_SUPABASE_URL")
      const key = env("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY")
      const response = await fetch(`${url}/rest/v1/venues?select=id,name&is_demo=eq.true`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      return expectOk(
        response,
        (body) => `${Array.isArray(body) ? body.length : 0} demo venues readable without a session`,
      )
    },
  },
  {
    name: "Supabase service role",
    run: async () => {
      const url = env("NEXT_PUBLIC_SUPABASE_URL")
      const key = env("SUPABASE_SERVICE_ROLE_KEY")
      const response = await fetch(`${url}/rest/v1/qloo_cache?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      return expectOk(response, () => "service role can reach the Qloo cache")
    },
  },
  {
    name: "Qloo",
    run: async () => {
      const base = env("QLOO_API_URL") || "https://hackathon.api.qloo.com"
      const params = new URLSearchParams({
        "filter.type": "urn:entity:artist",
        "signal.location": "POINT(-73.9575 40.7174)",
        "filter.popularity.max": "0.7",
        take: "3",
      })
      const response = await fetch(`${base}/v2/insights?${params}`, { headers: { "X-Api-Key": env("QLOO_API_KEY") } })
      return expectOk(response, () => "insights answered for Williamsburg (WKT point, the recipe plan 02 proved)")
    },
  },
  {
    name: "Google Places",
    run: async () => {
      const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": env("GOOGLE_PLACES_API_KEY"),
          "X-Goog-FieldMask": "places.id,places.displayName",
        },
        body: JSON.stringify({ textQuery: "bar in Williamsburg, Brooklyn", maxResultCount: 1 }),
      })
      return expectOk(response, (body) => `found ${(body as { places?: unknown[] })?.places?.length ?? 0} place`)
    },
  },
  {
    name: "Ticketmaster",
    run: async () => {
      const params = new URLSearchParams({
        apikey: env("TICKETMASTER_API_KEY"),
        latlong: "40.7174,-73.9575",
        radius: "2",
        unit: "km",
        size: "1",
      })
      const response = await fetch(`https://app.ticketmaster.com/discovery/v2/events.json?${params}`)
      return expectOk(response, () => "events search answered")
    },
  },
  {
    name: "Anthropic",
    run: async () => {
      const response = await fetch("https://api.anthropic.com/v1/models?limit=1", {
        headers: { "x-api-key": env("ANTHROPIC_API_KEY"), "anthropic-version": "2023-06-01" },
      })
      return expectOk(response, () => "key accepted")
    },
  },
]

const required: Record<string, string[]> = {
  Supabase: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"],
  "Supabase service role": ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"],
  Qloo: ["QLOO_API_KEY"],
  "Google Places": ["GOOGLE_PLACES_API_KEY"],
  Ticketmaster: ["TICKETMASTER_API_KEY"],
  Anthropic: ["ANTHROPIC_API_KEY"],
}

let failed = 0
for (const check of checks) {
  const missing = required[check.name].filter((name) => !env(name))
  if (missing.length > 0) {
    console.log(`SKIP ${check.name}: set ${missing.join(", ")}`)
    continue
  }
  try {
    console.log(`OK   ${check.name}: ${await check.run()}`)
  } catch (error) {
    failed += 1
    console.log(`FAIL ${check.name}: ${error instanceof Error ? error.message : "no answer"}`)
  }
}

process.exit(failed > 0 ? 1 : 0)
