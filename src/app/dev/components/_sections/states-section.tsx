"use client"

import { toast } from "sonner"
import { EmptyState } from "@/components/shared/empty-state"
import { ErrorState } from "@/components/shared/error-state"
import { SectionCard } from "@/components/shared/section-card"
import { CardSkeleton, ListSkeleton, TraceSkeleton } from "@/components/shared/skeletons"
import { GallerySection, Specimen } from "./gallery-section"

export function StatesSection() {
  return (
    <GallerySection
      title="Empty, loading and error"
      description="Every screen designs these. Nothing is ever left blank."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="The Copper Room" description="Bar in Williamsburg">
          <p className="text-sm text-muted-foreground">
            One idea per card: a title, a line of context, then the content.
          </p>
        </SectionCard>
        <EmptyState title="Nothing on Tuesdays nearby" description="No events within 2 km. That is your opening." />
      </div>
      <ErrorState
        title="The plan did not finish"
        description="Ticketmaster did not answer. Everything found so far is saved."
        onRetry={() => toast.info("Retrying")}
      />
      <div className="grid gap-6 md:grid-cols-3">
        <Specimen label="Card skeleton">
          <div className="w-full">
            <CardSkeleton />
          </div>
        </Specimen>
        <Specimen label="List skeleton">
          <div className="w-full">
            <ListSkeleton rows={3} />
          </div>
        </Specimen>
        <Specimen label="Trace skeleton">
          <div className="w-full">
            <TraceSkeleton steps={4} />
          </div>
        </Specimen>
      </div>
    </GallerySection>
  )
}
