import { drawDateBand, drawLine, drawQr, drawTitle, setFont, type AdFrame } from "./promote.draw"

// Ticket: paper, a giant day number that lands first, a tear line, then the name. No photo, so it always works.
export function ticket(frame: AdFrame) {
  const { ctx, width, height, unit, wide, palette, content, motion } = frame
  const pad = 80 * unit
  ctx.fillStyle = palette.paper
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = palette.field
  ctx.fillRect(0, 0, width, 28 * unit)

  const tear = wide ? width * 0.36 : height * 0.52
  const landed = motion.title(0)
  const daySize = (wide ? 380 : 560) * unit
  setFont(frame, "display", 800, daySize)
  ctx.fillStyle = palette.field
  ctx.textBaseline = "alphabetic"
  ctx.save()
  const dayBase = wide ? height * 0.72 : tear - 70 * unit
  ctx.translate(pad, dayBase)
  ctx.scale(1 + (1 - landed) * 0.25, 1 + (1 - landed) * 0.25)
  ctx.globalAlpha = landed
  ctx.fillText(content.day, 0, 0)
  ctx.restore()
  const dayWidth = ctx.measureText(content.day).width
  setFont(frame, "display", 700, 70 * unit)
  ctx.fillStyle = palette.ink
  ctx.globalAlpha = motion.band
  if (wide) ctx.fillText(`${content.weekday}, ${content.month}`, pad, dayBase + 90 * unit)
  else {
    ctx.fillText(content.weekday, pad + dayWidth + 36 * unit, dayBase - daySize * 0.42)
    ctx.fillText(content.month, pad + dayWidth + 36 * unit, dayBase - daySize * 0.42 + 78 * unit)
  }
  ctx.globalAlpha = 1

  ctx.strokeStyle = palette.ink
  ctx.lineWidth = 4 * unit
  ctx.setLineDash([18 * unit, 16 * unit])
  ctx.beginPath()
  if (wide) {
    ctx.moveTo(tear, 28 * unit)
    ctx.lineTo(tear, height)
  } else {
    ctx.moveTo(0, tear)
    ctx.lineTo(width, tear)
  }
  ctx.stroke()
  ctx.setLineDash([])

  const left = wide ? tear + pad * 0.8 : pad
  const maxWidth = width - left - pad - drawQr(frame, pad)
  drawLine(frame, content.kicker, {
    x: left,
    y: (wide ? height * 0.18 : tear) + 86 * unit,
    size: 32 * unit,
    color: palette.ink,
    maxWidth,
    weight: 600,
    alpha: motion.detail,
  })
  const band = 80 * unit
  const top = (wide ? height * 0.18 : tear) + 120 * unit
  const title = drawTitle(frame, {
    x: left,
    top,
    maxWidth,
    maxLines: 3,
    maxSize: (wide ? 190 : 160) * unit,
    maxHeight: height - top - (28 * unit + band + (content.line ? 84 * unit : 0) + pad * 0.7),
    color: palette.ink,
  })
  drawDateBand(frame, {
    x: left,
    y: title.bottom + 28 * unit,
    height: band,
    fill: palette.ink,
    color: palette.accent,
    maxWidth,
  })
  drawLine(frame, content.line, {
    x: left,
    y: title.bottom + band + 84 * unit,
    size: 36 * unit,
    color: palette.ink,
    maxWidth,
    alpha: motion.detail,
  })
}
