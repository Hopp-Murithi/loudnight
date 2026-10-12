"use client"

import { Plus, Trash2 } from "lucide-react"
import { SubmitButton } from "@/components/forms/submit-button"
import { CopyButton } from "@/components/shared/copy-button"
import { IconButton } from "@/components/shared/icon-button"
import { ShareButton } from "@/components/shared/share-button"
import { Button } from "@/components/ui/button"
import { GallerySection, Specimen } from "./gallery-section"

export function ActionsSection() {
  return (
    <GallerySection
      title="Actions"
      description="Buttons say what happens. Icon-only controls carry a name and a tooltip."
    >
      <Specimen label="Button variants">
        <Button>Plan my Tuesday</Button>
        <Button variant="outline">Change concept</Button>
        <Button variant="secondary">Edit night</Button>
        <Button variant="ghost">Cancel</Button>
        <Button variant="destructive">Delete venue</Button>
        <Button disabled>Publish night</Button>
      </Specimen>
      <Specimen label="Sizes">
        <Button size="sm">Small</Button>
        <Button>Default</Button>
        <Button size="lg">Large, for the door</Button>
      </Specimen>
      <Specimen label="Pending submit">
        <SubmitButton pending pendingLabel="Saving venue">
          Save venue
        </SubmitButton>
        <SubmitButton pending={false} pendingLabel="Saving venue">
          Save venue
        </SubmitButton>
      </Specimen>
      <Specimen label="Icon buttons">
        <IconButton label="Add a night">
          <Plus className="size-4" />
        </IconButton>
        <IconButton label="Remove from team" variant="outline">
          <Trash2 className="size-4" />
        </IconButton>
      </Specimen>
      <Specimen label="Copy and share">
        <CopyButton
          text="Afrobeats Tuesday at The Copper Room, 8pm. RSVP at encore.example/e/afrobeats-tuesday"
          label="Copy post"
        />
        <ShareButton url="https://encore.example/e/afrobeats-tuesday" title="Afrobeats Tuesday" label="Share night" />
      </Specimen>
    </GallerySection>
  )
}
