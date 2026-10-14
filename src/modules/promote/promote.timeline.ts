import { AD_VIDEO, AD_VIDEO_TYPES } from "@/config/promote"

const clamp = (value: number) => Math.min(1, Math.max(0, value))
const easeOut = (value: number) => 1 - (1 - value) ** 3

// How far along one move is at second `t`, eased so it settles instead of stopping dead.
export const phase = (t: number, from: number, to: number) => easeOut(clamp((t - from) / (to - from)))

export interface AdMotion {
  zoom: number
  title: (line: number) => number
  band: number
  detail: number
}

// Six seconds in four moves: the photo drifts in, the title rises, the date band wipes, the last line fades up.
export function motionAt(t: number): AdMotion {
  return {
    zoom: 1 + AD_VIDEO.zoom * clamp(t / AD_VIDEO.seconds),
    title: (line: number) => phase(t, 0.3 + line * 0.18, 1.1 + line * 0.18),
    band: phase(t, 1.2, 1.9),
    detail: phase(t, 1.8, 2.5),
  }
}

export const STILL = AD_VIDEO.seconds

// The first video type this browser can record, or null when it cannot record a canvas at all.
export function videoType(isSupported: (mime: string) => boolean) {
  return AD_VIDEO_TYPES.find((type) => isSupported(type.mime)) ?? null
}

// Breaks a title into at most `maxLines` lines that fit, measuring with the caller's own ruler.
export function wrapLines(words: string[], maxLines: number, fits: (line: string) => boolean): string[] | null {
  const lines: string[] = []
  let current = ""
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (fits(next)) current = next
    else {
      if (!current || !fits(word)) return null
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.length <= maxLines ? lines : null
}

// The largest size, stepping down, at which the text fits its box and its block is not too tall.
export function fitTitle(
  text: string,
  sizes: number[],
  maxLines: number,
  fits: (line: string, size: number) => boolean,
  roomFor: (size: number, lineCount: number) => boolean = () => true,
): { size: number; lines: string[] } {
  const words = text.split(/\s+/).filter(Boolean)
  for (const size of sizes) {
    const lines = wrapLines(words, maxLines, (line) => fits(line, size))
    if (lines && roomFor(size, lines.length)) return { size, lines }
  }
  const smallest = sizes[sizes.length - 1]
  return { size: smallest, lines: wrapLines(words, Number.MAX_SAFE_INTEGER, () => false) ?? [text] }
}
