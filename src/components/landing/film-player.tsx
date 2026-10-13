"use client"

import { Pause, Play } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"

const FILM = { src: "/media/encore-film.mp4", poster: "/media/encore-film.jpg" } as const

// The product film. Silent, so it may autoplay, but only when the viewer has not asked for reduced motion.
export function FilmPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    video.play().catch(() => undefined)
  }, [])

  const toggle = () => {
    const video = videoRef.current
    if (!video) return
    if (video.paused) video.play().catch(() => undefined)
    else video.pause()
  }

  return (
    <figure className="min-w-0">
      <div className="relative aspect-video overflow-hidden bg-black shadow-2xl ring-1 shadow-black/60 ring-white/10">
        <video
          ref={videoRef}
          muted
          loop
          playsInline
          preload="metadata"
          poster={FILM.poster}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          aria-describedby="film-caption"
          className="size-full object-cover"
        >
          <source src={FILM.src} type="video/mp4" />
        </video>
        <Button
          type="button"
          size="icon-lg"
          variant="secondary"
          onClick={toggle}
          aria-label={playing ? "Pause the film" : "Play the film"}
          className="absolute right-3 bottom-3 bg-black/70 text-white hover:bg-black/85"
        >
          {playing ? <Pause aria-hidden /> : <Play aria-hidden />}
        </Button>
      </div>
      <figcaption id="film-caption" className="mt-3 text-sm text-muted-foreground">
        A sample night in Encore: six guests at 9 pm, a concept with its receipts, the launch kit, then 46 through the
        door.
      </figcaption>
    </figure>
  )
}
