import { describe, expect, it } from "vitest"
import { googleCalendarLink, icsFile, type CalendarEvent } from "./events.calendar"
import { checkinCode, codeFrom, isCheckinCode } from "./events.codes"
import { rsvpSchema } from "./events.schemas"

describe("check-in codes", () => {
  it("are twelve characters with no look-alikes, from the random source", () => {
    const code = checkinCode()
    expect(code).toHaveLength(12)
    expect(isCheckinCode(code)).toBe(true)
    expect(code).not.toMatch(/[01ilo]/)
    expect(checkinCode()).not.toBe(code)
  })

  it("map every byte into the alphabet", () => {
    const allBytes = (bytes: Uint8Array) => bytes.map((_, index) => index * 23)
    expect(isCheckinCode(checkinCode(allBytes))).toBe(true)
  })

  it("are read back from the QR, the ticket link, or typed by hand", () => {
    const code = "ab2c3d4e5f6g"
    expect(codeFrom(`encore:checkin:${code}`)).toBe(code)
    expect(codeFrom(`https://encore.example/e/low-light/ticket/${code}?x=1`)).toBe(code)
    expect(codeFrom(" AB2C 3D4E 5F6G ")).toBe(code)
    expect(codeFrom("not a code")).toBeNull()
    expect(codeFrom("encore:checkin:short")).toBeNull()
  })
})

describe("calendar", () => {
  // Made-up night: 8 PM in Nairobi (UTC+3) is 17:00 UTC.
  const event: CalendarEvent = {
    uid: "night-1",
    title: "Afro Soul Supper, week one",
    description: "Live soul; bring a friend.\nDoors at 8.",
    location: "Sample Room, Langata Rd, Nairobi",
    url: "https://encore.example/e/afro-soul",
    startsAt: "2026-10-22T17:00:00Z",
    hours: 3,
  }

  it("writes the night in UTC with its end three hours later", () => {
    const ics = icsFile(event, new Date("2026-10-14T00:00:00Z"))
    expect(ics).toContain("DTSTART:20261022T170000Z")
    expect(ics).toContain("DTEND:20261022T200000Z")
    expect(ics).toContain("UID:night-1@encore")
  })

  it("escapes commas, semicolons and line breaks, and keeps every line short", () => {
    const ics = icsFile({ ...event, description: "x".repeat(200) + ", end" })
    expect(ics).toContain("SUMMARY:Afro Soul Supper\\, week one")
    expect(icsFile(event)).toContain("DESCRIPTION:Live soul\\; bring a friend.\\nDoors at 8.")
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true)
  })

  it("stays right across a clock change, because times are in UTC", () => {
    const winter = icsFile({ ...event, startsAt: "2026-11-03T01:00:00Z" })
    expect(winter).toContain("DTSTART:20261103T010000Z")
  })

  it("builds a Google Calendar link with the same times", () => {
    const link = new URL(googleCalendarLink(event))
    expect(link.searchParams.get("dates")).toBe("20261022T170000Z/20261022T200000Z")
    expect(link.searchParams.get("text")).toBe(event.title)
  })
})

describe("rsvpSchema", () => {
  const valid = { name: "Ada", partySize: 2, consent: false }

  it("needs only a name and a party size", () => {
    const parsed = rsvpSchema.parse({ ...valid, contact: "  " })
    expect(parsed).toMatchObject({ name: "Ada", partySize: 2 })
    expect(parsed.contact).toBeUndefined()
  })

  it("takes an email or a phone number as contact, with consent", () => {
    expect(rsvpSchema.safeParse({ ...valid, contact: "ada@example.com", consent: true }).success).toBe(true)
    expect(rsvpSchema.safeParse({ ...valid, contact: "+254 712 345 678", consent: true }).success).toBe(true)
  })

  it.each([
    ["no name", { ...valid, name: " " }],
    ["a party of eleven", { ...valid, partySize: 11 }],
    ["half a person", { ...valid, partySize: 1.5 }],
    ["a contact that is neither email nor phone", { ...valid, contact: "hello", consent: true }],
    ["a contact without consent", { ...valid, contact: "ada@example.com" }],
  ])("refuses %s", (_, input) => {
    expect(rsvpSchema.safeParse(input).success).toBe(false)
  })
})
