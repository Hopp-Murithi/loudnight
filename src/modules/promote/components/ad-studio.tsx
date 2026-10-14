"use client"

import { useRef } from "react"
import { CopyButton } from "@/components/shared/copy-button"
import { Button } from "@/components/ui/button"
import { AD_VIDEO, CAPTION_CHANNELS } from "@/config/promote"
import { formatLocalDate } from "@/lib/format"
import { TYPE } from "@/lib/typography"
import { cn } from "@/lib/utils"
import { useAdExport } from "../hooks/use-ad-export"
import { useAdStudio } from "../hooks/use-ad-studio"
import { useRefreshDetails } from "../hooks/use-refresh-details"
import { caption } from "../promote.copy"
import type { PromoBoard } from "../promote.schemas"
import { AdControls } from "./ad-controls"

// The ad studio: pick the night, shape the ad, then save it, film it or share it. Nothing here costs a model call.
export function AdStudio({ board, canEdit }: { board: PromoBoard; canEdit: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const studio = useAdStudio(board, canEdit, canvasRef)
  const captions = CAPTION_CHANNELS.map((channel) => ({
    ...channel,
    text: caption(channel.id, board, { ...studio.night, design: studio.design }, studio.content),
  }))
  const details = useRefreshDetails(studio.replay)
  const out = useAdExport(studio.scene, captions[0].text)
  const seconds = Math.round(out.progress * AD_VIDEO.seconds)

  return (
    <div className="space-y-10">
      <div role="radiogroup" aria-label="Which night" className="flex gap-2 overflow-x-auto pb-1">
        {board.nights.map((night) => (
          <button
            key={night.id}
            type="button"
            role="radio"
            aria-checked={night.id === studio.night.id}
            onClick={() => studio.setNightId(night.id)}
            className={cn(
              "flex min-h-11 shrink-0 items-baseline gap-2 border px-4 py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              night.id === studio.night.id
                ? "border-primary bg-primary/8"
                : "text-muted-foreground hover:border-foreground/40",
            )}
          >
            <span className="font-display text-2xl leading-none font-bold">
              {formatLocalDate(night.localDate, { day: "numeric" })}
            </span>
            <span className="text-sm">
              {formatLocalDate(night.localDate, { weekday: "short" })},{" "}
              {formatLocalDate(night.localDate, { month: "short" })}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:items-start">
        <section
          aria-label="Your ad"
          className="dark space-y-5 bg-background p-4 text-foreground sm:p-8 lg:sticky lg:top-20"
        >
          <div className="grid place-items-center">
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={`${studio.content.title}, ${studio.content.dateLine}`}
              className="h-auto max-h-[62vh] w-auto max-w-full shadow-2xl shadow-black/60"
              style={{ aspectRatio: `${studio.format.width} / ${studio.format.height}` }}
            />
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={out.share} disabled={out.busy !== null || !studio.scene}>
              {out.hasVideo ? "Share the video" : "Share"}
            </Button>
            <Button size="lg" variant="outline" onClick={out.saveImage} disabled={out.busy !== null || !studio.scene}>
              Save image
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={out.hasVideo ? out.saveVideo : out.makeVideo}
              disabled={out.busy !== null || !studio.scene}
              aria-live="polite"
            >
              {out.busy === "video"
                ? `Filming ${seconds} of ${AD_VIDEO.seconds} s`
                : out.hasVideo
                  ? "Save video"
                  : "Make a video"}
            </Button>
          </div>
          <div className="flex flex-wrap justify-center gap-x-1 gap-y-1 text-sm">
            <Button variant="ghost" onClick={studio.replay} disabled={!studio.scene}>
              Play it again
            </Button>
            {out.hasVideo && (
              <Button variant="ghost" onClick={out.makeVideo} disabled={out.busy !== null}>
                Film it again
              </Button>
            )}
            <Button variant="ghost" onClick={details.refresh} disabled={details.refreshing} aria-live="polite">
              {details.refreshing ? "Refreshing" : "Refresh the details"}
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            The ad is drawn from your night as it is now. Changed the date, the act or the name? Refresh, then save or
            film it again.
          </p>
        </section>
        <AdControls studio={studio} canEdit={canEdit} />
      </div>

      <section aria-labelledby="captions-heading" className="space-y-4">
        <div className="space-y-1">
          <h2 id="captions-heading" className={TYPE.h2}>
            Words to post with it
          </h2>
          <p className="text-sm text-muted-foreground">
            Written from your night&apos;s own details, sized for each place.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-2">
          {captions.map((item) => (
            <li key={item.id} className="flex min-w-0 flex-col gap-3 border bg-card p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{item.label}</h3>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {item.text.length} of {item.limit}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line text-muted-foreground">{item.text}</p>
              <CopyButton text={item.text} label="Copy" className="mt-auto self-start" />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
