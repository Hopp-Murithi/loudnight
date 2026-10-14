import { AD_COPY } from "@/config/ad-copy"
import { CAPTION_CHANNELS, type CaptionChannelId } from "@/config/promote"
import type { AdContent, PromoBoard, PromoNight } from "./promote.schemas"

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

// A calendar date read at noon UTC, so no time zone can shift the day, in the ad's own language.
const datePart = (localDate: string, locale: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" })
    .format(new Date(`${localDate}T12:00:00Z`))
    .replace(/\.$/, "")

const clockTime = (iso: string, timeZone: string, locale: string) =>
  new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", timeZone })
    .format(new Date(iso))
    .replace(":00", "")

// A link is only ever put on an ad when it is a full https address.
export function ticketLink(link: string): string | null {
  try {
    return new URL(link.trim()).protocol === "https:" ? link.trim() : null
  } catch {
    return null
  }
}

// What goes on the ad: venue, name, when, and one more line (the owner's own, else the booked acts, else nothing).
export function adContent(board: PromoBoard, night: PromoNight): AdContent {
  const copy = AD_COPY[night.design.language]
  const weekday = capital(datePart(night.localDate, copy.locale, { weekday: "long" }))
  const month = capital(datePart(night.localDate, copy.locale, { month: "short" }))
  const day = datePart(night.localDate, copy.locale, { day: "numeric" })
  const typed = night.design.line.trim()
  const link = ticketLink(night.design.link)
  return {
    kicker: board.venue.city ? `${board.venue.name}, ${board.venue.city}` : board.venue.name,
    title: board.night.name,
    weekday,
    month,
    day,
    dateLine: copy.dateLine(weekday, month, day, clockTime(night.startsAt, board.venue.timeZone, copy.locale)),
    line: typed || (board.acts.length > 0 ? copy.withActs(board.acts.map((act) => act.name)) : null),
    link,
    scanLabel: link ? copy.scan : null,
  }
}

const tag = (text: string) => {
  const joined = text
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9 ]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("")
  return joined ? `#${joined}` : null
}

// Hashtags from facts only: where it is, which night, what kind of night. No trend guessing.
export function hashtags(board: PromoBoard, content: AdContent): string[] {
  const place = board.venue.city?.split(",")[0] ?? ""
  const sources = [board.night.name, place, `${place} ${content.weekday}`, ...board.night.themes, board.venue.name]
  return [...new Set(sources.flatMap((source) => tag(source) ?? []))]
}

const fit = (text: string, limit: number) => (text.length <= limit ? text : `${text.slice(0, limit - 3).trimEnd()}...`)

// One caption per channel, inside its limit, in the ad's language. Built by rule from the ad's own facts.
export function caption(channel: CaptionChannelId, board: PromoBoard, night: PromoNight, content: AdContent): string {
  const copy = AD_COPY[night.design.language]
  const rule = CAPTION_CHANNELS.find((entry) => entry.id === channel) ?? CAPTION_CHANNELS[0]
  const tags = hashtags(board, content).slice(0, rule.hashtags).join(" ")
  const endings = [content.link ? `${copy.tickets} ${content.link}` : "", tags].filter(Boolean)
  const tail = endings.length > 0 ? `\n\n${endings.join("\n\n")}` : ""
  const body = copy.captions[channel]({
    where: copy.at(content.title, board.venue.name),
    when: content.dateLine,
    act: content.line ?? "",
    twist: night.variation,
  })
  return `${fit(body.trim(), Math.max(20, rule.limit - tail.length))}${tail}`
}
