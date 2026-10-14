// Every phrase Loudnight writes onto an ad or into a caption, in each language an ad can be made in.
// The night's name, the act's name and the owner's own line are theirs and are never translated.

export const AD_LANGUAGES = [
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
] as const

export type AdLanguage = (typeof AD_LANGUAGES)[number]["id"]

interface CaptionParts {
  where: string
  when: string
  act: string
  twist: string
}

export interface AdCopy {
  locale: string
  withActs: (names: readonly string[]) => string
  dateLine: (weekday: string, month: string, day: string, time: string) => string
  at: (title: string, venue: string) => string
  scan: string
  tickets: string
  captions: {
    instagram: (parts: CaptionParts) => string
    facebook: (parts: CaptionParts) => string
    x: (parts: CaptionParts) => string
    text: (parts: CaptionParts) => string
  }
}

const sentence = (text: string) => (text ? ` ${text}.` : "")

// Up to three names in full; past that, the first two and how many more, so the line fits on any ad.
function lineup(names: readonly string[], and: string, more: (count: number) => string): string {
  if (names.length <= 1) return names.join("")
  if (names.length > 3) return `${names.slice(0, 2).join(", ")} ${and} ${more(names.length - 2)}`
  return `${names.slice(0, -1).join(", ")} ${and} ${names[names.length - 1]}`
}

export const AD_COPY: Record<AdLanguage, AdCopy> = {
  en: {
    locale: "en-US",
    withActs: (names) => `With ${lineup(names, "and", (count) => `${count} more`)}`,
    dateLine: (weekday, month, day, time) => `${weekday} ${month} ${day}, ${time}`,
    at: (title, venue) => `${title} at ${venue}`,
    scan: "Scan for tickets",
    tickets: "Tickets:",
    captions: {
      instagram: ({ where, when, act, twist }) =>
        `${where}.\n\n${twist}${sentence(act)}\n\n${when}. Come early, bring someone.`,
      facebook: ({ where, when, act, twist }) => `${where}, ${when}.${sentence(act)} ${twist}`,
      x: ({ where, when, act }) => `${where}. ${when}.${sentence(act)}`,
      text: ({ where, when, act }) => `${where}, ${when}.${sentence(act)} See you there?`,
    },
  },
  // The weekly twist is written in English, so Spanish captions leave it out rather than mix languages.
  es: {
    locale: "es-US",
    withActs: (names) => `Con ${lineup(names, "y", (count) => `${count} más`)}`,
    dateLine: (weekday, month, day, time) => `${weekday} ${day} de ${month}, ${time}`,
    at: (title, venue) => `${title} en ${venue}`,
    scan: "Escanea para entradas",
    tickets: "Entradas:",
    captions: {
      instagram: ({ where, when, act }) => `${where}.\n\n${when}.${sentence(act)}\n\nLlega temprano y trae a alguien.`,
      facebook: ({ where, when, act }) => `${where}, ${when}.${sentence(act)} Te esperamos.`,
      x: ({ where, when, act }) => `${where}. ${when}.${sentence(act)}`,
      text: ({ where, when, act }) => `${where}, ${when}.${sentence(act)} ¿Nos vemos ahí?`,
    },
  },
}
