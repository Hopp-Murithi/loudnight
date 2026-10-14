import { describe, expect, it } from "vitest"
import { actsFromMusicBrainz, actsFromWikidata, countryQuery, nearbyQuery, openSearchFor } from "./talent.open"

// Hand-written rows in the shape the public endpoints return. Made up, not copied from a response.
const wikiRow = (id: string, name: string, extra: Record<string, string> = {}) => ({
  p: `http://www.wikidata.org/entity/${id}`,
  pLabel: name,
  links: "6",
  ...extra,
})

describe("openSearchFor", () => {
  it.each([
    ["dj_night", [], "Deep House Thursdays", { roles: ["dj", "musician"], townMusicians: false }],
    ["live_music", [], "Low Light Tuesdays", { roles: ["musician"], townMusicians: true }],
    ["talk", [], "Open Mic Poetry", { roles: ["poet"], townMusicians: false }],
    ["other", [], "Stand-up and Supper", { roles: ["comedian"], townMusicians: false }],
    ["talk", ["poetry", "comedy"], "Sunday Stories", { roles: ["poet", "comedian"], townMusicians: false }],
    ["screening", ["comedy"], "Cult Film Club", { roles: [], townMusicians: false }],
    ["food_and_drink", [], "Supper Club", { roles: [], townMusicians: false }],
  ])("a %s night called %s", (format, hosts, name, expected) => {
    expect(openSearchFor(format, hosts, name)).toEqual(expected)
  })
})

describe("queries", () => {
  it("asks for living people in the roles, near the venue, below the fame cap", () => {
    const query = nearbyQuery(["poet", "comedian"], { latitude: -0.4201, longitude: 36.9476 })
    expect(query).toContain("wd:Q49757 wd:Q245068 wd:Q18545066")
    expect(query).toContain('"Point(36.9476 -0.4201)"')
    expect(query).toContain("?links <= 20")
    expect(query).toContain("wdt:P570")
  })

  it("keeps anything but a country code out of the country query", () => {
    expect(countryQuery(["dj"], 'KE" } DROP')).toContain('wdt:P297 "KEDROP"')
  })
})

describe("actsFromWikidata", () => {
  it("turns rows into acts labelled with their record, once each, with fame on Qloo's scale", () => {
    const acts = actsFromWikidata([
      wikiRow("Q101", "Sample Poet", { birthLabel: "Nyeri", desc: "Kenyan poet", links: "15" }),
      wikiRow("Q101", "Sample Poet", { birthLabel: "Nyeri County" }),
      wikiRow("Q102", "Q102"),
      { pLabel: "No item" },
    ])
    expect(acts).toHaveLength(1)
    expect(acts[0]).toMatchObject({
      entityId: "wikidata:Q101",
      name: "Sample Poet",
      source: "wikidata",
      popularity: 0.5,
      affinity: 0,
      profile: { tagline: "Kenyan poet", origin: "Nyeri", listeners: null },
    })
    expect(acts[0].profile.channels).toEqual([
      { id: "wikidata", label: "Wikidata", url: "https://www.wikidata.org/wiki/Q101" },
    ])
  })

  it("never reads an unlabelled place as a hometown", () => {
    expect(actsFromWikidata([wikiRow("Q103", "Sample Comic", { birthLabel: "Q189074" })])[0].profile.origin).toBeNull()
  })
})

describe("actsFromMusicBrainz", () => {
  const artist = (id: string, extra: Record<string, unknown> = {}) => ({
    id,
    name: `Artist ${id.slice(0, 4)}`,
    type: "Person",
    "begin-area": { name: "Nairobi" },
    tags: [{ name: "benga" }, { name: "afro-jazz" }, { name: "kenya" }],
    ...extra,
  })

  it("keeps working, tagged people and groups with a real id, linked to their record", () => {
    const acts = actsFromMusicBrainz([
      artist("0f8b4c1e-0000-4000-8000-000000000001"),
      artist("0f8b4c1e-0000-4000-8000-000000000002", { "life-span": { ended: true } }),
      artist("0f8b4c1e-0000-4000-8000-000000000003", { type: "Orchestra" }),
      artist("not-an-id"),
      artist("0f8b4c1e-0000-4000-8000-000000000005", { tags: [] }),
      artist("0f8b4c1e-0000-4000-8000-000000000004", { type: "Group" }),
    ])
    expect(acts.map((act) => act.entityId)).toEqual([
      "musicbrainz:0f8b4c1e-0000-4000-8000-000000000001",
      "musicbrainz:0f8b4c1e-0000-4000-8000-000000000004",
    ])
    expect(acts[0].profile).toMatchObject({ origin: "Nairobi", genres: ["benga", "afro-jazz"], isGroup: false })
    expect(acts[1].profile.isGroup).toBe(true)
    expect(acts[0].profile.channels[0].url).toBe("https://musicbrainz.org/artist/0f8b4c1e-0000-4000-8000-000000000001")
  })
})
