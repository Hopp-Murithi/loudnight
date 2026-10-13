import Image from "next/image"
import type { CSSProperties } from "react"
import { NIGHT_PHOTOS, NIGHT_SLIDE_SECONDS } from "@/config/night-photos"

const CYCLE_SECONDS = NIGHT_PHOTOS.length * NIGHT_SLIDE_SECONDS

// Real venue nights cross-fade behind the panel. Pure CSS: no script, and under reduced motion the first photo holds still.
export function NightsGallery() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-sidebar">
      {NIGHT_PHOTOS.map((photo, index) => (
        <div
          key={photo.source}
          className="night-slide absolute inset-0"
          style={
            {
              "--night-delay": `${index * NIGHT_SLIDE_SECONDS}s`,
              "--night-cycle": `${CYCLE_SECONDS}s`,
            } as CSSProperties
          }
        >
          <Image
            src={photo.image}
            alt=""
            fill
            sizes="50vw"
            placeholder="blur"
            priority={index === 0}
            className="object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/35" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
    </div>
  )
}

export function PhotoCredits() {
  return (
    <p className="text-xs text-white/60">
      Photos via Wikimedia Commons:{" "}
      {NIGHT_PHOTOS.map((photo, index) => (
        <span key={photo.source}>
          <a
            href={photo.source}
            target="_blank"
            rel="noreferrer"
            className="underline-offset-2 hover:text-white hover:underline"
          >
            {photo.author}
          </a>{" "}
          ({photo.license}){index < NIGHT_PHOTOS.length - 1 ? ", " : "."}
        </span>
      ))}
    </p>
  )
}
