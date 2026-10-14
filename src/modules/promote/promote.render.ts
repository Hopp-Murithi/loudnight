import { AD_PALETTES, AD_VIDEO, type AdFormat } from "@/config/promote"
import type { AdFrame } from "./promote.draw"
import { PAINTERS } from "./promote.painters"
import type { AdContent, AdDesign } from "./promote.schemas"
import { motionAt, STILL, videoType } from "./promote.timeline"

export interface AdScene {
  content: AdContent
  design: AdDesign
  format: AdFormat
  image: HTMLImageElement | null
  fonts: { display: string; body: string }
  qr: boolean[][] | null
}

// Draws the ad as it looks at second `t`. The preview, the saved image and every video frame all come through here.
export function paintAd(canvas: HTMLCanvasElement, scene: AdScene, t: number) {
  const { width, height } = scene.format
  if (canvas.width !== width) canvas.width = width
  if (canvas.height !== height) canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.globalAlpha = 1
  const frame: AdFrame = {
    ctx,
    width,
    height,
    unit: Math.min(width, height) / 1080,
    wide: width / height > 1.3,
    content: scene.content,
    palette: AD_PALETTES[scene.design.palette],
    image: scene.image,
    imageSize: scene.image ? { width: scene.image.naturalWidth, height: scene.image.naturalHeight } : null,
    fonts: scene.fonts,
    motion: motionAt(t),
    qr: scene.qr,
  }
  PAINTERS[scene.design.template](frame)
}

// A photo the canvas may export: same-origin, or a local file. A photo that fails to load is simply left out.
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => resolve(null)
    image.src = src
  })
}

// The app's own two typefaces, by the names the page gave them, loaded before anything is drawn with them.
export async function adFonts(): Promise<AdScene["fonts"]> {
  const style = getComputedStyle(document.documentElement)
  const display = style.getPropertyValue("--font-big-shoulders").trim() || "sans-serif"
  const body = style.getPropertyValue("--font-geist-sans").trim() || "sans-serif"
  await Promise.all([document.fonts.load(`800 120px ${display}`), document.fonts.load(`500 32px ${body}`)]).catch(
    () => undefined,
  )
  return { display, body }
}

export function stillBlob(scene: AdScene): Promise<Blob | null> {
  const canvas = document.createElement("canvas")
  paintAd(canvas, scene, STILL)
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"))
}

export interface RecordedAd {
  blob: Blob
  extension: string
}

const canRecord = (mime: string) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(mime)

// Plays the ad once on a hidden canvas and records it. Null when this browser cannot record a canvas.
export function recordAd(scene: AdScene, onProgress: (done: number) => void): Promise<RecordedAd | null> {
  const type = videoType(canRecord)
  const canvas = document.createElement("canvas")
  paintAd(canvas, scene, 0)
  if (!type || typeof canvas.captureStream !== "function") return Promise.resolve(null)

  return new Promise((resolve) => {
    const recorder = new MediaRecorder(canvas.captureStream(AD_VIDEO.framesPerSecond), {
      mimeType: type.mime,
      videoBitsPerSecond: AD_VIDEO.bitsPerSecond,
    })
    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => event.data.size > 0 && chunks.push(event.data)
    recorder.onerror = () => resolve(null)
    recorder.onstop = () =>
      resolve({ blob: new Blob(chunks, { type: type.mime.split(";")[0] }), extension: type.extension })
    recorder.start()
    const started = performance.now()
    const tick = (now: number) => {
      const t = (now - started) / 1000
      paintAd(canvas, scene, Math.min(t, STILL))
      onProgress(Math.min(1, t / AD_VIDEO.seconds))
      if (t < AD_VIDEO.seconds) requestAnimationFrame(tick)
      else recorder.stop()
    }
    requestAnimationFrame(tick)
  })
}
