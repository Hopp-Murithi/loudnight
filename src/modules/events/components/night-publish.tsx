"use client"

import { CopyButton } from "@/components/shared/copy-button"
import { SubmitButton } from "@/components/forms/submit-button"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import type { Enums } from "@/types/database"
import { eventUrl } from "../events.links"
import { useNightAction } from "../hooks/use-night-action"

interface NightPublishProps {
  nightId: string
  slug: string
  status: Enums<"night_status">
}

// A night's public life from its card: publish it, open or copy its page, cancel it, or take it back while nobody has
// signed up yet.
export function NightPublish({ nightId, slug, status }: NightPublishProps) {
  const action = useNightAction(nightId)
  const busy = action.isPending
  const pending = (which: "publish" | "unpublish" | "cancel") => busy && action.variables === which

  if (status === "published")
    return (
      <div className="mt-auto flex flex-wrap gap-2">
        <Button nativeButton={false} render={<a href={ROUTES.eventPage(slug)} target="_blank" rel="noreferrer" />}>
          Event page<span className="sr-only">, opens in a new tab</span>
        </Button>
        <CopyButton text={eventUrl(slug)} label="Copy link" />
        <SubmitButton
          type="button"
          variant="ghost"
          pending={pending("cancel")}
          pendingLabel="Cancelling"
          disabled={busy}
          onClick={() => {
            if (window.confirm("Cancel this night? Guests who open its page will see that it is cancelled.")) {
              action.mutate("cancel")
            }
          }}
        >
          Cancel night
        </SubmitButton>
        <SubmitButton
          type="button"
          variant="ghost"
          pending={pending("unpublish")}
          pendingLabel="Taking back"
          disabled={busy}
          onClick={() => action.mutate("unpublish")}
        >
          Back to draft
        </SubmitButton>
      </div>
    )

  return (
    <SubmitButton
      type="button"
      className="mt-auto self-start"
      pending={pending("publish")}
      pendingLabel="Publishing"
      onClick={() => action.mutate("publish")}
    >
      {status === "cancelled" ? "Publish again" : "Publish"}
    </SubmitButton>
  )
}
