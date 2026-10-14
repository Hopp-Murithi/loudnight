"use client"

import { useState } from "react"
import { SubmitButton } from "@/components/forms/submit-button"
import { Button } from "@/components/ui/button"
import { plural } from "@/lib/format"
import { TYPE } from "@/lib/typography"
import { ReceiptSheet } from "@/modules/concepts/components/receipt-sheet"
import type { TalentView } from "@/modules/series/series.schemas"
import { useFindTalent } from "../hooks/use-talent"
import { ContactSheet } from "./contact-sheet"
import { TalentCard } from "./talent-card"

interface TalentShortlistProps {
  seriesId: string
  nightName: string
  talent: TalentView[]
  references: TalentView[]
  canEdit: boolean
}

const LIST = new Intl.ListFormat("en-US", { style: "long", type: "conjunction" })

function summary(acts: TalentView[]): string {
  const booked = acts.filter((act) => act.booked)
  if (booked.length > 0) return `${plural(booked.length, "act")} booked: ${LIST.format(booked.map((act) => act.name))}.`
  const tastes = acts.find((act) => act.fitSignals.length > 0)?.fitSignals ?? []
  const why = tastes.length > 0 ? `fans of ${LIST.format(tastes)} near you follow` : "this crowd follows"
  return acts.some((act) => act.source !== "night")
    ? `Acts from your own country come first, then others ${why}. Big names are left out, so all are small enough to book.`
    : `Performers ${why}, each small enough to book.`
}

// Who could play the night: acts a small room can book, who they are, and one tap to reach each of them.
export function TalentShortlist({ seriesId, nightName, talent, references, canEdit }: TalentShortlistProps) {
  const find = useFindTalent(seriesId)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  const [showBigger, setShowBigger] = useState(false)
  const bigger = talent.filter((act) => act.reach === "beyond" && !act.booked)
  const shown = showBigger ? talent : talent.filter((act) => !bigger.includes(act))
  const searched = talent.length > 0 || references.length > 0

  return (
    <section aria-labelledby="talent-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 id="talent-heading" className={TYPE.h2}>
            Who could play it
          </h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{summary(talent)}</p>
        </div>
        {canEdit && (
          <SubmitButton
            type="button"
            variant={searched ? "outline" : "default"}
            size={searched ? "default" : "lg"}
            pending={find.isPending}
            pendingLabel="Finding performers"
            onClick={() => find.mutate()}
          >
            {searched ? "Find new performers" : "Find performers"}
          </SubmitButton>
        )}
      </div>

      {searched && talent.length === 0 && (
        <p className="border border-dashed p-5 text-sm text-muted-foreground">
          No local acts matched closely. Book a local act in one of the styles below instead.
        </p>
      )}

      {shown.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((act) => (
            <TalentCard
              key={act.id}
              act={act}
              onOpen={() => setOpenId(act.id)}
              onReceipt={() => setReceiptId(act.id)}
            />
          ))}
        </ul>
      )}

      {bigger.length > 0 && (
        <Button variant="outline" onClick={() => setShowBigger((value) => !value)}>
          {showBigger
            ? "Hide the names beyond this budget"
            : `Show ${bigger.length} ${bigger.length === 1 ? "name" : "names"} probably beyond this budget`}
        </Button>
      )}

      {references.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Too big to book, but the sound this crowd follows:{" "}
          <span className="text-foreground">{LIST.format(references.map((act) => act.name))}</span>. Look for a local
          act like them.
        </p>
      )}

      <ReceiptSheet source={receiptId ? { kind: "talent", id: receiptId } : null} onClose={() => setReceiptId(null)} />
      <ContactSheet
        act={talent.find((act) => act.id === openId) ?? null}
        nightName={nightName}
        canEdit={canEdit}
        onClose={() => setOpenId(null)}
      />
    </section>
  )
}
