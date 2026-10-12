"use client"

import Link from "next/link"
import { useState } from "react"
import { CopyButton } from "@/components/shared/copy-button"
import { DetailSheet } from "@/components/shared/detail-sheet"
import { StickyActionBar } from "@/components/shared/sticky-action-bar"
import { Button } from "@/components/ui/button"
import { GallerySection, Specimen } from "./gallery-section"

const RECEIPT = `GET /v2/insights
filter.type=urn:entity:artist
signal.location=POINT(-73.9575 40.7174)`

export function OverlaysSection() {
  const [open, setOpen] = useState(false)

  return (
    <GallerySection
      title="Sheets, sticky actions and shells"
      description="Details open beside the list on desktop and from the bottom on phones."
    >
      <Specimen label="Detail sheet">
        <Button variant="outline" onClick={() => setOpen(true)}>
          Open a receipt
        </Button>
      </Specimen>
      <Specimen label="Shells">
        <Button variant="outline" nativeButton={false} render={<Link href="/dev/components/shell" />}>
          Open the signed-in shell
        </Button>
        <Button variant="outline" nativeButton={false} render={<Link href="/" />}>
          Open the public shell
        </Button>
      </Specimen>
      <DetailSheet
        open={open}
        onOpenChange={setOpen}
        title="Afrobeats affinity 0.94"
        description="Fetched from Qloo on Oct 20 at 14:02"
        footer={<CopyButton text={RECEIPT} label="Copy request" />}
      >
        <pre className="overflow-x-auto bg-muted p-3 text-xs">{RECEIPT}</pre>
      </DetailSheet>
      <StickyActionBar>
        <Button variant="ghost">Back</Button>
        <Button>Continue</Button>
      </StickyActionBar>
    </GallerySection>
  )
}
