"use client"

import { useCallback, useState } from "react"
import { toast } from "sonner"
import { downloadBlob, fileSlug, shareFile } from "@/lib/download"
import { recordAd, stillBlob, type AdScene, type RecordedAd } from "../promote.render"

type Busy = "image" | "video" | "share" | null

// Turns the ad on screen into files: a PNG, a recorded video, or either one handed to the phone's share sheet.
export function useAdExport(scene: AdScene | null, caption: string) {
  const [busy, setBusy] = useState<Busy>(null)
  const [progress, setProgress] = useState(0)
  const [video, setVideo] = useState<{ ad: RecordedAd; for: AdScene } | null>(null)
  const name = scene ? `${fileSlug(scene.content.title)}-${scene.format.id}` : "ad"
  const ready = video && video.for === scene ? video.ad : null

  const run = useCallback(async (kind: Busy, work: () => Promise<void>) => {
    setBusy(kind)
    try {
      await work()
    } catch {
      toast.error("That did not work. Try again.")
    } finally {
      setBusy(null)
    }
  }, [])

  const saveImage = () =>
    run("image", async () => {
      const blob = scene && (await stillBlob(scene))
      if (!blob) throw new Error("no image")
      downloadBlob(blob, `${name}.png`)
    })

  const makeVideo = () =>
    run("video", async () => {
      if (!scene) return
      setProgress(0)
      const ad = await recordAd(scene, setProgress)
      if (!ad) {
        toast.error("This browser cannot record video. Save the image, or try Chrome or Safari.")
        return
      }
      setVideo({ ad, for: scene })
      toast.success("Your video is ready")
    })

  const saveVideo = () => ready && downloadBlob(ready.blob, `${name}.${ready.extension}`)

  // Shares the video when one has been made for this exact ad, otherwise the image. Falls back to saving the file.
  const share = () =>
    run("share", async () => {
      if (!scene) return
      const blob = ready?.blob ?? (await stillBlob(scene))
      if (!blob) throw new Error("no file")
      const fileName = ready ? `${name}.${ready.extension}` : `${name}.png`
      if (await shareFile(new File([blob], fileName, { type: blob.type }), caption)) return
      downloadBlob(blob, fileName)
      toast.message("Saved to your downloads. Sharing straight to apps works on a phone.")
    })

  return { busy, progress, hasVideo: ready !== null, saveImage, makeVideo, saveVideo, share }
}
