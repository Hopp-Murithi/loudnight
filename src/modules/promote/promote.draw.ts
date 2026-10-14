import type { AdPalette } from "@/config/promote"
import type { AdContent } from "./promote.schemas"
import { fitTitle, type AdMotion } from "./promote.timeline"

export interface AdFrame {
  ctx: CanvasRenderingContext2D
  width: number
  height: number
  // One unit is a 1080th of the short side, so every template scales to any format from the same numbers.
  unit: number
  wide: boolean
  content: AdContent
  palette: AdPalette
  image: CanvasImageSource | null
  imageSize: { width: number; height: number } | null
  fonts: { display: string; body: string }
  motion: AdMotion
  qr: boolean[][] | null
}

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

const SIZE_STEPS = [1, 0.88, 0.77, 0.67, 0.58, 0.5, 0.43, 0.37, 0.31, 0.26]
const LINE_HEIGHT = 0.95

export function setFont(frame: AdFrame, face: "display" | "body", weight: number, size: number) {
  frame.ctx.font = `${weight} ${Math.round(size)}px ${frame.fonts[face]}`
}

// Fills the box with the photo, cropped to cover it and pushed in by the zoom. False when there is no photo.
export function coverPhoto(frame: AdFrame, box: Box, zoom: number): boolean {
  const { ctx, image, imageSize } = frame
  if (!image || !imageSize) return false
  const scale = Math.max(box.w / imageSize.width, box.h / imageSize.height) * zoom
  const w = imageSize.width * scale
  const h = imageSize.height * scale
  ctx.drawImage(image, box.x + (box.w - w) / 2, box.y + (box.h - h) / 2, w, h)
  return true
}

interface TitleOptions {
  x: number
  maxWidth: number
  maxLines: number
  maxSize: number
  color: string
  top?: number
  bottom?: number
  maxHeight?: number
}

// The night's name at the largest size that fits its width and height, each line rising in. Returns where it sits.
export function drawTitle(frame: AdFrame, options: TitleOptions): { top: number; bottom: number; size: number } {
  const { ctx, content, motion } = frame
  const sizes = SIZE_STEPS.map((step) => options.maxSize * step)
  const fit = fitTitle(
    content.title,
    sizes,
    options.maxLines,
    (line, size) => {
      setFont(frame, "display", 800, size)
      return ctx.measureText(line).width <= options.maxWidth
    },
    (size, count) => size * LINE_HEIGHT * count <= (options.maxHeight ?? Number.POSITIVE_INFINITY),
  )
  const lineHeight = fit.size * LINE_HEIGHT
  const height = lineHeight * fit.lines.length
  const top = options.top ?? (options.bottom ?? height) - height
  setFont(frame, "display", 800, fit.size)
  ctx.fillStyle = options.color
  ctx.textBaseline = "alphabetic"
  fit.lines.forEach((line, index) => {
    const shown = motion.title(index)
    ctx.globalAlpha = shown
    ctx.fillText(line, options.x, top + lineHeight * (index + 1) - fit.size * 0.14 + (1 - shown) * fit.size * 0.4)
  })
  ctx.globalAlpha = 1
  return { top, bottom: top + height, size: fit.size }
}

interface BandOptions {
  x: number
  y: number
  height: number
  fill: string | null
  stroke?: string
  color: string
  maxWidth: number
}

// The date and time on a band of colour that wipes in from the left. Returns the band's width.
export function drawDateBand(frame: AdFrame, options: BandOptions): number {
  const { ctx, content, motion, unit } = frame
  const inset = options.height * 0.38
  let size = options.height * 0.56
  setFont(frame, "display", 700, size)
  while (ctx.measureText(content.dateLine).width > options.maxWidth - inset * 2 && size > 18 * unit) {
    size *= 0.94
    setFont(frame, "display", 700, size)
  }
  const width = ctx.measureText(content.dateLine).width + inset * 2
  ctx.save()
  ctx.beginPath()
  ctx.rect(options.x, options.y - 2, width * motion.band + 2, options.height + 4)
  ctx.clip()
  if (options.fill) {
    ctx.fillStyle = options.fill
    ctx.fillRect(options.x, options.y, width, options.height)
  }
  if (options.stroke) {
    ctx.strokeStyle = options.stroke
    ctx.lineWidth = Math.max(2, 4 * unit)
    ctx.strokeRect(
      options.x + ctx.lineWidth / 2,
      options.y + ctx.lineWidth / 2,
      width - ctx.lineWidth,
      options.height - ctx.lineWidth,
    )
  }
  ctx.fillStyle = options.color
  ctx.textBaseline = "middle"
  ctx.fillText(content.dateLine, options.x + inset, options.y + options.height / 2 + size * 0.04)
  ctx.restore()
  return width
}

// A line of body type gives up at most a fifth of its size before it is shortened.
const LINE_SHRINK = 0.8

interface TextOptions {
  x: number
  y: number
  size: number
  color: string
  maxWidth: number
  weight?: number
  alpha?: number
}

// One small line of body type: a little smaller if it would run off the ad, then shortened with dots.
export function drawLine(frame: AdFrame, text: string | null, options: TextOptions) {
  if (!text) return
  const { ctx } = frame
  let size = options.size
  setFont(frame, "body", options.weight ?? 500, size)
  while (ctx.measureText(text).width > options.maxWidth && size > options.size * LINE_SHRINK) {
    size *= 0.96
    setFont(frame, "body", options.weight ?? 500, size)
  }
  let shown = text
  while (shown.length > 4 && ctx.measureText(shown).width > options.maxWidth)
    shown = `${shown.slice(0, -4).trimEnd()}...`
  ctx.globalAlpha = options.alpha ?? 1
  ctx.fillStyle = options.color
  ctx.textBaseline = "alphabetic"
  ctx.fillText(shown, options.x, options.y)
  ctx.globalAlpha = 1
}

// The QR code on a white tile, bottom right, with its label. Returns the width taken, or zero with no ticket link.
export function drawQr(frame: AdFrame, pad: number): number {
  const { ctx, qr, content, width, height, unit, wide, motion } = frame
  if (!qr || !content.scanLabel) return 0
  const size = (wide ? 150 : 200) * unit
  const quiet = size * 0.08
  const x = width - pad - size
  const y = height - pad - size
  ctx.globalAlpha = motion.detail
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(x, y, size, size)
  const cell = (size - quiet * 2) / qr.length
  ctx.fillStyle = "#000000"
  qr.forEach((row, r) =>
    row.forEach((dark, c) => {
      if (dark) ctx.fillRect(x + quiet + c * cell, y + quiet + r * cell, Math.ceil(cell), Math.ceil(cell))
    }),
  )
  // The label is fitted to the tile's own width, so the code and its label take one tidy column.
  let labelSize = 24 * unit
  setFont(frame, "body", 600, labelSize)
  while (ctx.measureText(content.scanLabel).width > size - 16 * unit && labelSize > 10 * unit) {
    labelSize *= 0.94
    setFont(frame, "body", 600, labelSize)
  }
  const bar = labelSize * 1.7
  ctx.fillStyle = "#FFFFFF"
  ctx.fillRect(x, y - bar, size, bar)
  ctx.fillStyle = "#000000"
  ctx.textBaseline = "middle"
  ctx.fillText(content.scanLabel, x + (size - ctx.measureText(content.scanLabel).width) / 2, y - bar / 2)
  ctx.globalAlpha = 1
  return size + 40 * unit
}
