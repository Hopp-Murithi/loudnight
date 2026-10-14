import { describe, expect, it } from "vitest"
import { EMPTY_PROFILE, profileFrom, readProfile } from "./talent.profile"

// A hand-written object in the shape of a Qloo artist. Never real Qloo data.
const entity = {
  _synthetic: true,
  entity_id: "a",
  name: "Sample Act",
  properties: {
    image: { url: "https://images.qloo.com/i/SAMPLE-420x-auto.jpg" },
    short_descriptions: [
      { value: "Eine Beispielband.", languages: ["de"] },
      { value: "A sample band known for sample songs.", languages: ["en"] },
    ],
    known_for: "Their sample live shows.",
    primary_genres: ["Sample Rock", "Sample Folk", "Sample Soul", "Sample Pop"],
    notable_songs: ["Sample One", "Sample Two"],
    is_group: true,
  },
  external: {
    instagram: [{ id: "sample.act" }, { id: "other" }],
    twitter: [{ id: "sample_act" }],
    spotify: [
      { id: "small1", monthly_listeners: 12 },
      { id: "big1", monthly_listeners: 34500 },
    ],
  },
}

describe("profileFrom", () => {
  it("keeps the photo, the English line, a few genres and songs, and the public channels", () => {
    const profile = profileFrom(entity)
    expect(profile).toMatchObject({
      imageUrl: "https://images.qloo.com/i/SAMPLE-420x-auto.jpg",
      tagline: "A sample band known for sample songs.",
      knownFor: "Their sample live shows.",
      genres: ["Sample Rock", "Sample Folk", "Sample Soul"],
      songs: ["Sample One", "Sample Two"],
      isGroup: true,
    })
    expect(profile.channels.map((channel) => [channel.label, channel.url])).toEqual([
      ["Instagram", "https://www.instagram.com/sample.act"],
      ["Spotify", "https://open.spotify.com/artist/big1"],
      ["X", "https://x.com/sample_act"],
    ])
  })

  it("takes the listener count from the account with the biggest audience", () => {
    expect(profileFrom(entity).listeners).toBe(34500)
  })

  it("drops a photo that is not on Qloo's image host, and handles that could break a link", () => {
    const odd = {
      properties: { image: { url: "https://evil.example/x.jpg" } },
      external: { instagram: [{ id: "a/b?c=d" }], twitter: [{ id: "javascript:alert(1)" }] },
    }
    const profile = profileFrom(odd)
    expect(profile.imageUrl).toBeNull()
    expect(profile.channels).toEqual([])
  })

  it("is an empty profile for an entity with nothing useful on it", () => {
    expect(profileFrom({ entity_id: "x", name: "Bare" })).toEqual(EMPTY_PROFILE)
    expect(profileFrom(null)).toEqual(EMPTY_PROFILE)
  })
})

describe("profileFrom, for a person rather than a band", () => {
  // The shape Qloo uses for people: untagged lines in many languages, and usernames under their own keys.
  const person = {
    _synthetic: true,
    entity_id: "p",
    name: "Sample Person",
    properties: {
      short_descriptions: [
        { value: "Amerikaans actrice" },
        { value: "USA lavakoomik ja kirjanik" },
        { value: "American comedian and writer" },
      ],
      official_website: "https://sample.example/",
    },
    external: { instagram_username: "sample.person", twitter_username: "sampleperson" },
  }

  it("shows the English line, never one in another language", () => {
    expect(profileFrom(person).tagline).toBe("American comedian and writer")
  })

  it("shows no line at all when none of them is English", () => {
    const lines = ["Amerikaans actrice", "guionista", "actor estatunidenc", "actor de Guatemala", "None"]
    const foreign = { properties: { short_descriptions: lines.map((value) => ({ value })) } }
    expect(profileFrom(foreign).tagline).toBeNull()
  })

  it("finds their website and usernames under the keys people use", () => {
    expect(profileFrom(person).channels.map((channel) => [channel.label, channel.url])).toEqual([
      ["Website", "https://sample.example/"],
      ["Instagram", "https://www.instagram.com/sample.person"],
      ["X", "https://x.com/sampleperson"],
    ])
  })

  it("drops a website that is not a plain https address", () => {
    const odd = { properties: { official_website: "javascript:alert(1)" } }
    expect(profileFrom(odd).channels).toEqual([])
  })
})

describe("readProfile", () => {
  it("returns what was stored when it has the right shape", () => {
    const stored = profileFrom(entity)
    expect(readProfile(stored)).toEqual(stored)
  })

  it("falls back to an empty profile for rows written before profiles existed", () => {
    expect(readProfile({})).toEqual(EMPTY_PROFILE)
    expect(readProfile(null)).toEqual(EMPTY_PROFILE)
  })
})
