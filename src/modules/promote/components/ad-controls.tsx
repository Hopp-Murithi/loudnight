"use client"

import { useId, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AD_LANGUAGES } from "@/config/ad-copy"
import { AD_LINE_MAX, AD_LINK_MAX, type AdPhotoSource } from "@/config/promote"
import { cn } from "@/lib/utils"
import type { useAdStudio } from "../hooks/use-ad-studio"
import { FormatPicker, PalettePicker } from "./ad-pickers"
import { TemplatePicker } from "./template-picker"

type Studio = ReturnType<typeof useAdStudio>

const OPTION = "min-h-9 border px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
const OPTION_ON = "border-primary bg-primary/8 font-medium"
const OPTION_OFF = "text-muted-foreground hover:border-foreground/40"
const PHOTO_LABELS: Record<AdPhotoSource, string> = { mood: "A night photo", act: "The booked act", own: "Your own" }

// Every choice an owner makes about the ad, top to bottom in the order they matter. Changes show at once.
export function AdControls({ studio, canEdit }: { studio: Studio; canEdit: boolean }) {
  const lineId = useId()
  const linkId = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const { design, change } = studio
  const linkWrong = design.link.trim() !== "" && studio.content.link === null
  const photoOptions: AdPhotoSource[] = ["mood", ...(studio.hasActPhoto ? (["act"] as const) : []), "own"]

  return (
    <div className="space-y-6">
      <FormatPicker value={studio.format.id} onChange={studio.setFormatId} />
      <TemplatePicker value={design.template} palette={design.palette} onChange={(template) => change({ template })} />
      <PalettePicker value={design.palette} onChange={(palette) => change({ palette })} />

      {design.template !== "ticket" && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Photo</h3>
          <div role="radiogroup" aria-label="Photo" className="flex flex-wrap gap-2">
            {photoOptions.map((source) => (
              <button
                key={source}
                type="button"
                role="radio"
                aria-checked={design.photo === source}
                onClick={() =>
                  source === "own" && !studio.hasOwnPhoto ? fileRef.current?.click() : change({ photo: source })
                }
                className={cn(OPTION, design.photo === source ? OPTION_ON : OPTION_OFF)}
              >
                {PHOTO_LABELS[source]}
              </button>
            ))}
            {studio.hasOwnPhoto && (
              <Button variant="ghost" onClick={() => fileRef.current?.click()}>
                Change photo
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            aria-label="Choose your own photo"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) studio.chooseOwnPhoto(file)
              event.target.value = ""
            }}
          />
          <p className="text-xs text-muted-foreground">
            Your own photo stays on this device. Use the act&apos;s photo only if they are happy for you to.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium">Language</h3>
        <div role="radiogroup" aria-label="Language" className="flex flex-wrap gap-2">
          {AD_LANGUAGES.map((language) => (
            <button
              key={language.id}
              type="button"
              role="radio"
              aria-checked={design.language === language.id}
              onClick={() => change({ language: language.id })}
              className={cn(OPTION, design.language === language.id ? OPTION_ON : OPTION_OFF)}
            >
              {language.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor={linkId} className="text-sm font-medium">
          Ticket or RSVP link
        </label>
        <Input
          id={linkId}
          type="url"
          inputMode="url"
          value={design.link}
          maxLength={AD_LINK_MAX}
          placeholder="https://"
          aria-invalid={linkWrong}
          aria-describedby={`${linkId}-hint`}
          onChange={(event) => change({ link: event.target.value })}
        />
        <p id={`${linkId}-hint`} className={cn("text-xs", linkWrong ? "text-destructive" : "text-muted-foreground")}>
          {linkWrong
            ? "Use a full link that starts with https://"
            : studio.night.status === "published"
              ? "Left empty, the ad links to this night's event page, where guests save a place."
              : "Optional. Adds a QR code to the ad and the link to your captions. Publish the night to link its event page."}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor={lineId} className="text-sm font-medium">
          One more line
        </label>
        <Input
          id={lineId}
          value={design.line}
          maxLength={AD_LINE_MAX}
          placeholder={studio.content.line ?? "Free entry before nine"}
          onChange={(event) => change({ line: event.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Optional. Left empty, the ad names your booked act{canEdit ? "" : " (view only: changes are not saved)"}.
        </p>
      </div>

      <Button variant="outline" onClick={studio.startOver}>
        Start this ad over
      </Button>
    </div>
  )
}
