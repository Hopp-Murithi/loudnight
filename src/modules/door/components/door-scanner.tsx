"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>
}
type DetectorClass = new (options: { formats: string[] }) => BarcodeDetectorLike

const detectorClass = (): DetectorClass | null =>
  typeof window !== "undefined" && "BarcodeDetector" in window
    ? ((window as unknown as { BarcodeDetector: DetectorClass }).BarcodeDetector ?? null)
    : null

// Reads a ticket's QR with the camera where the browser can (Chrome on Android); the code can always be typed.
// Any phone can also scan a ticket with its own camera app: the ticket page then offers staff a check-in button.
export function DoorScanner({ onCode, busy }: { onCode: (code: string) => void; busy: boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const [typed, setTyped] = useState("")
  const [camera, setCamera] = useState<"off" | "on" | "denied" | "unsupported">(() =>
    detectorClass() ? "off" : "unsupported",
  )

  useEffect(() => {
    const Detector = detectorClass()
    if (camera !== "on" || !Detector || !video.current) return
    const element = video.current
    const detector = new Detector({ formats: ["qr_code"] })
    let stream: MediaStream | null = null
    let timer = 0
    let last = ""
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" } })
      .then((media) => {
        stream = media
        element.srcObject = media
        void element.play()
        timer = window.setInterval(async () => {
          const [found] = await detector.detect(element).catch(() => [])
          if (found && found.rawValue !== last) {
            last = found.rawValue
            onCode(found.rawValue)
          }
        }, 350)
      })
      .catch(() => setCamera("denied"))
    return () => {
      window.clearInterval(timer)
      stream?.getTracks().forEach((track) => track.stop())
    }
  }, [camera, onCode])

  return (
    <div className="space-y-4">
      {camera === "on" && (
        <div className="relative overflow-hidden bg-black">
          <video ref={video} muted playsInline className="aspect-square w-full object-cover" />
          <div aria-hidden className="absolute inset-[18%] border-4 border-spotlight" />
        </div>
      )}
      {camera === "off" && (
        <Button size="lg" className="h-12 w-full" onClick={() => setCamera("on")}>
          Open the camera
        </Button>
      )}
      {camera === "on" && (
        <Button variant="outline" className="h-12 w-full" onClick={() => setCamera("off")}>
          Close the camera
        </Button>
      )}
      {camera === "denied" && (
        <p role="status" className="text-sm text-muted-foreground">
          The camera is blocked. Type the code under the ticket&apos;s QR instead.
        </p>
      )}
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault()
          if (typed.trim()) onCode(typed)
          setTyped("")
        }}
      >
        <Label htmlFor="door-code">Ticket code</Label>
        <div className="flex gap-2">
          <Input
            id="door-code"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            placeholder="12 letters and numbers"
            autoCapitalize="characters"
            autoComplete="off"
            className="h-12 font-mono text-lg tracking-widest uppercase"
          />
          <Button type="submit" size="lg" className="h-12" disabled={busy}>
            Check in
          </Button>
        </div>
      </form>
    </div>
  )
}
