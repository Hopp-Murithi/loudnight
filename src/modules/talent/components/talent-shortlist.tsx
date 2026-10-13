"use client"

import { BadgeCheck, MessageSquareText, Mic, RefreshCw } from "lucide-react"
import { useState } from "react"
import { SubmitButton } from "@/components/forms/submit-button"
import { ToneBadge } from "@/components/shared/tone-badge"
import type { Tone } from "@/components/shared/tone"
import { Button } from "@/components/ui/button"
import { TIER_LABELS, type PopularityTier } from "@/config/series"
import { TYPE } from "@/lib/typography"
import { ReceiptSheet } from "@/modules/concepts/components/receipt-sheet"
import { formatAffinity } from "@/modules/concepts/concepts.grounding"
import type { TalentView } from "@/modules/series/series.schemas"
import { useFindTalent } from "../hooks/use-talent"
import { OutreachSheet } from "./outreach-sheet"

interface TalentShortlistProps {
  seriesId: string
  talent: TalentView[]
  references: TalentView[]
  canEdit: boolean
}

const TIER_TONE: Record<PopularityTier, Tone> = {
  local: "success",
  emerging: "info",
  regional: "neutral",
  national: "neutral",
}

const LIST = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" })

const sharedTastes = (acts: TalentView[]) => {
  const tastes = acts[0]?.fitSignals ?? []
  return tastes.length > 0
    ? `Fans of ${LIST.format(tastes)} near you already follow these performers, and each is small enough to book.`
    : "Performers this crowd already follows, small enough to book."
}

// Who could play the night: acts a small room can book, why each fits, and a first message ready to send.
export function TalentShortlist({ seriesId, talent, references, canEdit }: TalentShortlistProps) {
  const find = useFindTalent(seriesId)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [writing, setWriting] = useState<TalentView | null>(null)
  const searched = talent.length > 0 || references.length > 0

  return (
    <section aria-labelledby="talent-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="talent-heading" className={TYPE.h2}>
            Who could play it
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {sharedTastes(talent)} You send the message, not Encore.
          </p>
        </div>
        {canEdit && (
          <SubmitButton
            type="button"
            variant={searched ? "outline" : "default"}
            size={searched ? "default" : "lg"}
            pending={find.isPending}
            pendingLabel="Looking for performers"
            onClick={() => find.mutate()}
          >
            {searched ? <RefreshCw aria-hidden className="size-4" /> : <Mic aria-hidden className="size-4" />}
            {searched ? "Look again" : "Find performers"}
          </SubmitButton>
        )}
      </div>

      {searched && talent.length === 0 && (
        <p className="border border-dashed p-5 text-sm text-muted-foreground">
          No local acts matched closely. Book a local act in one of the styles below instead.
        </p>
      )}

      {talent.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {talent.map((act) => (
            <li key={act.id} className="flex min-w-0 flex-col gap-3 border bg-card p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="min-w-0 font-display text-2xl leading-tight font-bold text-balance">{act.name}</h3>
                <ToneBadge tone={TIER_TONE[act.tier]} label={TIER_LABELS[act.tier]} />
              </div>
              <div className="mt-auto flex flex-wrap gap-2 pt-1">
                {act.hasReceipt && (
                  <button
                    type="button"
                    onClick={() => setReceiptId(act.id)}
                    className="inline-flex min-h-9 items-center gap-2 border border-spotlight/50 bg-spotlight/10 px-2.5 text-sm outline-none hover:border-spotlight hover:bg-spotlight/20 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <BadgeCheck aria-hidden className="size-4 text-primary" />
                    Crowd overlap
                    <span className="bg-background px-1.5 py-0.5 text-xs tabular-nums">
                      {formatAffinity(act.overlap)}
                    </span>
                    <span className="sr-only">, open the receipt</span>
                  </button>
                )}
                {canEdit && act.message && (
                  <Button variant="outline" onClick={() => setWriting(act)}>
                    <MessageSquareText aria-hidden className="size-4" />
                    Message
                    <span className="sr-only">for {act.name}</span>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {references.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Too big to book, but the sound this crowd follows:{" "}
          <span className="text-foreground">{references.map((act) => act.name).join(", ")}</span>. Look for a local act
          like them.
        </p>
      )}

      <ReceiptSheet source={receiptId ? { kind: "talent", id: receiptId } : null} onClose={() => setReceiptId(null)} />
      <OutreachSheet act={writing} onClose={() => setWriting(null)} />
    </section>
  )
}
