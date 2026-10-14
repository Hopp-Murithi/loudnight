import type { AdTemplateId } from "@/config/promote"
import { coverPhoto, drawDateBand, drawLine, drawQr, drawTitle, type AdFrame } from "./promote.draw"
import { ticket } from "./promote.ticket"

// Marquee: the photo fills the ad, a shadow rises from the bottom (from the left on a banner), the name sits on it.
function marquee(frame: AdFrame) {
  const { ctx, width, height, unit, wide, palette, content, motion } = frame
  const pad = 72 * unit
  ctx.fillStyle = palette.ink
  ctx.fillRect(0, 0, width, height)
  if (!coverPhoto(frame, { x: 0, y: 0, w: width, h: height }, motion.zoom)) {
    const glow = ctx.createRadialGradient(width * 0.8, 0, 0, width * 0.8, 0, Math.max(width, height))
    glow.addColorStop(0, palette.field)
    glow.addColorStop(0.7, palette.ink)
    ctx.fillStyle = glow
    ctx.fillRect(0, 0, width, height)
  }
  const shade = wide
    ? ctx.createLinearGradient(0, 0, width * 0.85, 0)
    : ctx.createLinearGradient(0, height * 0.3, 0, height)
  shade.addColorStop(0, wide ? `${palette.ink}F2` : `${palette.ink}00`)
  shade.addColorStop(1, wide ? `${palette.ink}00` : `${palette.ink}F5`)
  ctx.fillStyle = shade
  ctx.fillRect(0, 0, width, height)

  const maxWidth = (wide ? width * 0.6 : width) - pad * 2 - drawQr(frame, pad)
  drawLine(frame, content.kicker, {
    x: pad,
    y: pad + 30 * unit,
    size: 32 * unit,
    color: palette.paper,
    maxWidth,
    alpha: motion.detail,
  })
  let bottom = height - pad
  if (content.line) {
    drawLine(frame, content.line, {
      x: pad,
      y: bottom,
      size: 38 * unit,
      color: palette.paper,
      maxWidth,
      alpha: motion.detail,
    })
    bottom -= 74 * unit
  }
  const band = 88 * unit
  drawDateBand(frame, { x: pad, y: bottom - band, height: band, fill: palette.accent, color: palette.ink, maxWidth })
  drawTitle(frame, {
    x: pad,
    bottom: bottom - band - 34 * unit,
    maxWidth,
    maxLines: wide ? 2 : 3,
    maxSize: (wide ? 150 : 190) * unit,
    maxHeight: bottom - band - 34 * unit - (pad + 90 * unit),
    color: palette.paper,
  })
}

// Block: a field of colour with the photo in a slanted window, tinted with the same colour so the two belong.
function block(frame: AdFrame) {
  const { ctx, width, height, unit, wide, palette, content, motion } = frame
  const pad = 72 * unit
  const slant = 110 * unit
  ctx.fillStyle = palette.field
  ctx.fillRect(0, 0, width, height)

  const edge = wide ? width * 0.5 : height * 0.5
  const window = new Path2D()
  if (wide) {
    window.moveTo(edge + slant, 0)
    window.lineTo(width, 0)
    window.lineTo(width, height)
    window.lineTo(edge, height)
  } else {
    window.moveTo(0, 0)
    window.lineTo(width, 0)
    window.lineTo(width, edge - slant)
    window.lineTo(0, edge)
  }
  window.closePath()
  ctx.save()
  ctx.clip(window)
  ctx.fillStyle = palette.ink
  ctx.fillRect(0, 0, width, height)
  const box = wide ? { x: edge, y: 0, w: width - edge, h: height } : { x: 0, y: 0, w: width, h: edge }
  coverPhoto(frame, box, motion.zoom)
  ctx.globalAlpha = 0.3
  ctx.fillStyle = palette.field
  ctx.fillRect(0, 0, width, height)
  ctx.restore()

  ctx.strokeStyle = palette.accent
  ctx.lineWidth = 14 * unit
  ctx.beginPath()
  if (wide) {
    ctx.moveTo(edge + slant, 0)
    ctx.lineTo(edge, height)
  } else {
    ctx.moveTo(0, edge)
    ctx.lineTo(width, edge - slant)
  }
  ctx.stroke()

  const maxWidth = (wide ? edge : width) - pad * 2 - (wide ? 0 : drawQr(frame, pad))
  if (wide) drawQr(frame, pad)
  const band = 84 * unit
  const top = wide ? height * 0.16 : edge + 44 * unit
  // Room is kept under the title for the date band, the extra line and the venue, so nothing ever overlaps.
  const below = 30 * unit + band + (content.line ? 78 * unit : 0) + 60 * unit + pad
  const title = drawTitle(frame, {
    x: pad,
    top,
    maxWidth,
    maxLines: 3,
    maxSize: (wide ? 200 : 170) * unit,
    maxHeight: height - top - below,
    color: palette.paper,
  })
  drawDateBand(frame, {
    x: pad,
    y: title.bottom + 30 * unit,
    height: band,
    fill: null,
    stroke: palette.accent,
    color: palette.accent,
    maxWidth,
  })
  drawLine(frame, content.line, {
    x: pad,
    y: title.bottom + band + 86 * unit,
    size: 36 * unit,
    color: palette.paper,
    maxWidth,
    alpha: motion.detail,
  })
  drawLine(frame, content.kicker, {
    x: pad,
    y: height - pad,
    size: 30 * unit,
    color: palette.paper,
    maxWidth,
    weight: 600,
    alpha: motion.detail,
  })
}

export const PAINTERS: Record<AdTemplateId, (frame: AdFrame) => void> = { marquee, block, ticket }
