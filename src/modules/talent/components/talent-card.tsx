"use client"

import { BadgeCheck } from "lucide-react"
import Image from "next/image"
import { ToneBadge } from "@/components/shared/tone-badge"
import type { Tone } from "@/components/shared/tone"
import { Button } from "@/components/ui/button"
import { isOpenSource, OPEN_SOURCE_LABELS, TIER_LABELS, type PopularityTier } from "@/config/series"
import { REACH_LABELS } from "@/config/talent-reach"
import { initials } from "@/lib/text"
import { cn } from "@/lib/utils"
import { formatAffinity } from "@/modules/concepts/concepts.grounding"
import type { TalentView } from "@/modules/series/series.schemas"
import { hometown, listenersText, matchLabel } from "../talent.display"

interface TalentCardProps {
  act: TalentView
  onOpen: () => void
  onReceipt: () => void
}

const TIER_TONE: Record<PopularityTier, Tone> = {
  local: "success",
  emerging: "info",
  regional: "neutral",
  national: "neutral",
}

// One performer: their face, what they play, how well their fans match this crowd, and one way in to contact them.
export function TalentCard({ act, onOpen, onReceipt }: TalentCardProps) {
  const { profile } = act
  const listeners = listenersText(profile.listeners)
  const from = hometown(profile.origin)
  const nearby = act.source === "area" || act.source === "both"
  const record = isOpenSource(act.source) ? OPEN_SOURCE_LABELS[act.source] : null

  return (
    <li className="flex min-w-0 flex-col overflow-hidden border bg-card">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${act.name}`}
        className="dark poster-glow group relative block aspect-[4/3] w-full overflow-hidden text-left text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {profile.imageUrl ? (
          <Image
            src={profile.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 24rem, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-[center_18%] transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 grid place-items-center font-display text-7xl font-extrabold text-foreground/25"
          >
            {initials(act.name)}
          </span>
        )}
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-background via-background/20 to-transparent"
        />
        <span className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {act.booked && (
            <span className="bg-spotlight px-2 py-0.5 text-xs font-medium text-primary-foreground">Booked</span>
          )}
          {nearby && <span className="bg-background/85 px-2 py-0.5 text-xs font-medium">Popular near you</span>}
          {record && <span className="bg-background/85 px-2 py-0.5 text-xs font-medium">From {record}</span>}
        </span>
        <span className="absolute inset-x-4 bottom-3 space-y-1">
          <span className="block font-display text-3xl leading-none font-bold text-balance">{act.name}</span>
          {from && <span className="block text-xs text-foreground/85">Born in {from}</span>}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex h-6 items-center gap-1.5 overflow-hidden">
          <ToneBadge tone={TIER_TONE[act.tier]} label={TIER_LABELS[act.tier]} />
          {profile.genres.map((genre) => (
            <span key={genre} className="shrink-0 border px-1.5 py-0.5 text-xs whitespace-nowrap text-muted-foreground">
              {genre}
            </span>
          ))}
        </div>
        {act.reach && (
          <p
            className={cn(
              "text-xs",
              act.reach === "within" ? "text-success" : act.reach === "stretch" ? "text-warning" : "text-destructive",
            )}
          >
            {REACH_LABELS[act.reach]}
            <span className="text-muted-foreground"> (Loudnight&apos;s estimate: ask the act)</span>
          </p>
        )}
        <p className="line-clamp-2 min-h-10 text-sm text-muted-foreground">{profile.tagline}</p>
        {act.hasReceipt && (
          <button
            type="button"
            onClick={onReceipt}
            className="flex min-h-[3.75rem] flex-wrap content-center items-center gap-x-2 gap-y-1 border border-spotlight/50 bg-spotlight/10 px-2.5 py-1.5 text-left text-sm outline-none hover:border-spotlight hover:bg-spotlight/20 focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <BadgeCheck aria-hidden className="size-4 shrink-0 text-primary" />
            <span>{matchLabel(act.overlap)}</span>
            <span className="bg-background px-1.5 py-0.5 text-xs tabular-nums">{formatAffinity(act.overlap)}</span>
            {listeners && <span className="text-muted-foreground">{listeners}</span>}
            <span className="sr-only">, open the receipt</span>
          </button>
        )}
        <Button className="mt-auto" variant={act.booked ? "outline" : "default"} onClick={onOpen}>
          {act.booked ? "Details and message" : "Get in touch"}
        </Button>
      </div>
    </li>
  )
}
