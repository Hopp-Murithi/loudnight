// The ad studio: formats, templates and colourways. Canvas cannot read CSS tokens, so ad colours live here only.

export const AD_FORMATS = [
  { id: "poster", label: "Poster", width: 1080, height: 1350, hint: "Instagram and Facebook feed" },
  { id: "story", label: "Story", width: 1080, height: 1920, hint: "Stories, Reels and TikTok" },
  { id: "square", label: "Square", width: 1080, height: 1080, hint: "Any feed" },
  { id: "banner", label: "Banner", width: 1200, height: 628, hint: "Facebook events, X and web" },
] as const

export type AdFormatId = (typeof AD_FORMATS)[number]["id"]
export type AdFormat = (typeof AD_FORMATS)[number]

export const AD_TEMPLATES = [
  { id: "marquee", label: "Marquee", hint: "The photo, with the name over it" },
  { id: "block", label: "Block", hint: "A field of colour and a slanted photo" },
  { id: "ticket", label: "Ticket", hint: "Paper, a big date, no photo" },
] as const

export type AdTemplateId = (typeof AD_TEMPLATES)[number]["id"]

export interface AdPalette {
  label: string
  ink: string
  field: string
  accent: string
  paper: string
}

export const AD_PALETTES = {
  ember: { label: "Ember", ink: "#1C1411", field: "#A4361C", accent: "#F2B860", paper: "#F6ECE6" },
  plum: { label: "Plum", ink: "#1E1026", field: "#6B2A86", accent: "#FF9EBB", paper: "#FBEFF5" },
  lagoon: { label: "Lagoon", ink: "#06262B", field: "#0F6E80", accent: "#7CE0C3", paper: "#EAF7F3" },
  sunset: { label: "Sunset", ink: "#2A0D12", field: "#C8402B", accent: "#FFC857", paper: "#FFF3E0" },
} as const satisfies Record<string, AdPalette>

export type AdPaletteId = keyof typeof AD_PALETTES

export const AD_PHOTOS = ["mood", "act", "own"] as const
export type AdPhotoSource = (typeof AD_PHOTOS)[number]

// Six seconds is long enough to read and short enough for every network's ad slot.
export const AD_VIDEO = { seconds: 6, framesPerSecond: 30, bitsPerSecond: 6_000_000, zoom: 0.14 } as const

// Preferred first: MP4 uploads everywhere; WebM is what older browsers can record.
export const AD_VIDEO_TYPES = [
  { mime: "video/mp4;codecs=avc1.42E01E", extension: "mp4" },
  { mime: "video/mp4", extension: "mp4" },
  { mime: "video/webm;codecs=vp9", extension: "webm" },
  { mime: "video/webm", extension: "webm" },
] as const

export const AD_LINE_MAX = 70

export const CAPTION_CHANNELS = [
  { id: "instagram", label: "Instagram", limit: 2200, hashtags: 5 },
  { id: "facebook", label: "Facebook", limit: 500, hashtags: 0 },
  { id: "x", label: "X", limit: 280, hashtags: 2 },
  { id: "text", label: "Text message", limit: 160, hashtags: 0 },
] as const

export type CaptionChannelId = (typeof CAPTION_CHANNELS)[number]["id"]

export const AD_LINK_MAX = 300

export const AD_DEFAULT = {
  template: "marquee",
  palette: "ember",
  photo: "mood",
  line: "",
  language: "en",
  link: "",
} as const
