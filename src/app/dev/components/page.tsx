import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { SkipLink } from "@/components/layout/skip-link"
import { devToolsEnabled } from "@/config/dev"
import { TYPE } from "@/lib/typography"
import { ActionsSection } from "./_sections/actions-section"
import { ConceptsSection } from "./_sections/concepts-section"
import { FoundationsSection } from "./_sections/foundations-section"
import { GapSection } from "./_sections/gap-section"
import { OverlaysSection } from "./_sections/overlays-section"
import { PreviewToolbar } from "./_sections/preview-toolbar"
import { ProgressSection } from "./_sections/progress-section"
import { RunsSection } from "./_sections/runs-section"
import { SeriesSection } from "./_sections/series-section"
import { StatesSection } from "./_sections/states-section"
import { TasteSection } from "./_sections/taste-section"

export const metadata: Metadata = { title: "Components", robots: { index: false } }

// The design system in one place, for checking every component in every state, width and theme.
export default async function ComponentsGallery({ searchParams }: PageProps<"/dev/components">) {
  if (!devToolsEnabled()) notFound()
  const embedded = (await searchParams).embed === "1"

  return (
    <>
      <SkipLink />
      <main id="content" className="mx-auto max-w-6xl space-y-16 px-4 py-10 sm:px-6">
        {embedded && <h1 className="sr-only">Components</h1>}
        {!embedded && (
          <header className="space-y-4">
            <h1 className={TYPE.h1}>Components</h1>
            <p className={TYPE.lead}>Every shared component, with its states. Development builds only.</p>
            <PreviewToolbar />
          </header>
        )}
        <FoundationsSection />
        <ActionsSection />
        <ProgressSection />
        <StatesSection />
        <OverlaysSection />
        <TasteSection />
        <GapSection />
        <ConceptsSection />
        <RunsSection />
        <SeriesSection />
      </main>
    </>
  )
}
