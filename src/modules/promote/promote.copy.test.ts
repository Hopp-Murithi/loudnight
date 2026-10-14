import { describe, expect, it } from "vitest"
import { AD_COPY } from "@/config/ad-copy"
import { AD_DEFAULT, CAPTION_CHANNELS } from "@/config/promote"
import { adContent, caption, hashtags, ticketLink } from "./promote.copy"
import { qrMatrix } from "./promote.qr"
import { adDesignSchema, readDesign, type PromoBoard, type PromoNight } from "./promote.schemas"

const night: PromoNight = {
  id: "n1",
  sequence: 1,
  startsAt: "2026-10-21T00:00:00Z",
  localDate: "2026-10-20",
  localTime: "20:00",
  variation: "Opening night: the idea in full, with a welcome for everyone who walks in.",
  status: "draft",
  design: { ...AD_DEFAULT },
}
const spanish: PromoNight = { ...night, design: { ...night.design, language: "es" } }
const linked: PromoNight = { ...night, design: { ...night.design, link: "https://tickets.example/low-light" } }

const board: PromoBoard = {
  venue: { id: "v1", name: "Sample Room", city: "Brooklyn, NY", timeZone: "America/New_York" },
  night: { name: "Low Light Tuesdays", format: "live_music", themes: ["ambient", "lounge nights"] },
  nights: [night],
  acts: [{ name: "Sample Act", imageUrl: null }],
}

describe("adContent", () => {
  it("puts the venue, the night, the date and the booked act on the ad", () => {
    expect(adContent(board, night)).toEqual({
      kicker: "Sample Room, Brooklyn, NY",
      title: "Low Light Tuesdays",
      weekday: "Tuesday",
      month: "Oct",
      day: "20",
      dateLine: "Tuesday Oct 20, 8 PM",
      line: "With Sample Act",
      link: null,
      scanLabel: null,
    })
  })

  it("lets the owner's own line replace the act", () => {
    const typed = { ...night, design: { ...night.design, line: "  Free entry before nine " } }
    expect(adContent(board, typed).line).toBe("Free entry before nine")
  })

  it("leaves the extra line off when nobody is booked and nothing is typed", () => {
    expect(adContent({ ...board, acts: [] }, night).line).toBeNull()
  })

  it("names every booked act, and folds a long lineup so it fits the ad, in either language", () => {
    const names = (count: number) =>
      Array.from({ length: count }, (_, index) => ({ name: `Act ${index + 1}`, imageUrl: null }))
    const line = (count: number, which = night) => adContent({ ...board, acts: names(count) }, which).line
    expect(line(2)).toBe("With Act 1 and Act 2")
    expect(line(3)).toBe("With Act 1, Act 2 and Act 3")
    expect(line(5)).toBe("With Act 1, Act 2 and 3 more")
    expect(line(2, spanish)).toBe("Con Act 1 y Act 2")
    expect(line(4, spanish)).toBe("Con Act 1, Act 2 y 2 más")
  })

  it("keeps the minutes when the night does not start on the hour", () => {
    expect(adContent(board, { ...night, startsAt: "2026-10-20T23:30:00Z" }).dateLine).toBe("Tuesday Oct 20, 7:30 PM")
  })

  it("writes the date and the act in Spanish, and leaves the night's own name alone", () => {
    const content = adContent(board, spanish)
    expect(content.title).toBe("Low Light Tuesdays")
    expect(content.weekday).toBe("Martes")
    expect(content.dateLine).toMatch(/^Martes 20 de Oct, 8/)
    expect(content.line).toBe("Con Sample Act")
  })

  it("carries a ticket link and its scan label only when the link is a full https address", () => {
    expect(adContent(board, linked)).toMatchObject({
      link: "https://tickets.example/low-light",
      scanLabel: "Scan for tickets",
    })
    const plain = { ...night, design: { ...night.design, link: "tickets.example" } }
    expect(adContent(board, plain).link).toBeNull()
  })
})

describe("ticketLink", () => {
  it("refuses anything that is not https, so an ad never carries a script or an unsafe address", () => {
    expect(ticketLink("http://tickets.example")).toBeNull()
    expect(ticketLink("javascript:alert(1)")).toBeNull()
    expect(ticketLink("  https://tickets.example/x  ")).toBe("https://tickets.example/x")
  })
})

describe("hashtags", () => {
  it("come from the night, the place and the themes, with no repeats and no stray characters", () => {
    expect(hashtags(board, adContent(board, night))).toEqual([
      "#LowLightTuesdays",
      "#Brooklyn",
      "#BrooklynTuesday",
      "#Ambient",
      "#LoungeNights",
      "#SampleRoom",
    ])
  })
})

describe("caption", () => {
  const all = (which: PromoNight) =>
    CAPTION_CHANNELS.map((channel) => ({ channel, text: caption(channel.id, board, which, adContent(board, which)) }))

  it("stays inside every channel's limit in both languages, even with a very long twist and a link", () => {
    const long = { ...linked, variation: "A very long twist. ".repeat(200) }
    for (const which of [long, { ...long, design: { ...long.design, language: "es" as const } }]) {
      for (const { channel, text } of all(which)) expect(text.length).toBeLessThanOrEqual(channel.limit)
    }
  })

  it("says the night, the venue, when, and who is playing", () => {
    const text = caption("x", board, night, adContent(board, night))
    expect(text).toContain("Low Light Tuesdays at Sample Room")
    expect(text).toContain("Tuesday Oct 20, 8 PM")
    expect(text).toContain("With Sample Act")
  })

  it("adds hashtags only where the channel uses them", () => {
    const text = (channel: "instagram" | "text" | "facebook") => caption(channel, board, night, adContent(board, night))
    expect(text("instagram")).toContain("#LowLightTuesdays")
    expect(text("text")).not.toContain("#")
    expect(text("facebook")).not.toContain("#")
  })

  it("ends with the ticket link when there is one", () => {
    expect(caption("text", board, linked, adContent(board, linked))).toContain(
      "Tickets: https://tickets.example/low-light",
    )
  })

  it("is written in Spanish without the English twist", () => {
    const text = caption("instagram", board, spanish, adContent(board, spanish))
    expect(text).toContain("Low Light Tuesdays en Sample Room")
    expect(text).toContain("Con Sample Act")
    expect(text).not.toContain("Opening night")
  })
})

describe("the copy config", () => {
  it("has every phrase and every caption shape in both languages", () => {
    expect(Object.keys(AD_COPY.es).sort()).toEqual(Object.keys(AD_COPY.en).sort())
    expect(Object.keys(AD_COPY.es.captions).sort()).toEqual(Object.keys(AD_COPY.en.captions).sort())
  })
})

describe("the design schema, language and link", () => {
  const older = { template: "block", palette: "plum", photo: "mood", line: "" }

  it("opens a design saved before languages and links existed, in English with no link", () => {
    expect(readDesign(older)).toEqual({ ...older, language: "en", link: "" })
  })

  it("accepts an https ticket link and refuses anything else", () => {
    expect(adDesignSchema.safeParse({ ...older, link: "https://tickets.example/x" }).success).toBe(true)
    expect(adDesignSchema.safeParse({ ...older, link: "tickets.example" }).success).toBe(false)
    expect(adDesignSchema.safeParse({ ...older, link: "javascript:alert(1)" }).success).toBe(false)
  })
})

describe("qrMatrix", () => {
  it("is a square grid with the three finder corners dark", () => {
    const grid = qrMatrix("https://tickets.example/low-light")
    expect(grid.length).toBeGreaterThanOrEqual(21)
    expect(grid.every((row) => row.length === grid.length)).toBe(true)
    expect([grid[0][0], grid[0][grid.length - 1], grid[grid.length - 1][0]]).toEqual([true, true, true])
  })

  it("changes when the link changes", () => {
    expect(qrMatrix("https://a.example/1")).not.toEqual(qrMatrix("https://a.example/2"))
  })
})
