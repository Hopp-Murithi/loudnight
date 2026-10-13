import type { ConceptView, ReceiptView } from "@/modules/concepts/concepts.schemas"
import { ConceptShortlist } from "@/modules/concepts/components/concept-shortlist"
import { ReceiptBody } from "@/modules/concepts/components/receipt-body"
import { GallerySection, Specimen } from "./gallery-section"

// Made-up sample values for checking the layout. Never real Qloo data.
const concept = (rank: number, name: string, total: number, chosen = false): ConceptView => ({
  id: `sample-${rank}`,
  rank,
  name,
  pitch: "A sample pitch, one sentence long, the way a bar owner would say it.",
  reasonBeatsNearby: "Nothing within walking distance runs a night like this on that day.",
  format: rank === 2 ? "food_and_drink" : "live_music",
  scores: { audienceFit: 0.93, novelty: 1, venueFit: rank === 3 ? 0.5 : 1, costFit: 0.8, total },
  estimatedCostCents: 30000 + rank * 5000,
  chosen,
  evidence: [
    { id: `e${rank}a`, claim: "Sample style is big nearby", value: 0.998 },
    { id: `e${rank}b`, claim: "Its fans also love sample food", value: 0.856 },
  ],
})

const RECEIPT: ReceiptView = {
  claim: "Its fans also love sample food",
  value: 0.856,
  endpoint: "/v2/insights",
  params: {
    "filter.type": "urn:tag",
    "filter.tag.types": "urn:tag:genre:place",
    "signal.interests.tags": "urn:tag:genre:music:sample",
    "signal.location": "POINT(-97.73 30.26)",
    take: 50,
  },
  fetchedAt: "2026-10-13T09:00:00Z",
  slice: {
    tag_id: "urn:tag:genre:place:sample",
    name: "Sample food",
    types: ["urn:entity:place"],
    query: { affinity: 0.856 },
  },
  highlight: ["query", "affinity"],
}

export function ConceptsSection() {
  return (
    <GallerySection title="Concepts and receipts" description="The shortlist, one chosen night, and a receipt body.">
      <ConceptShortlist
        canChoose
        concepts={[
          concept(1, "Sample Soul Supper Club", 96, true),
          concept(2, "Sample Night", 91),
          concept(3, "A Longer Sample Name for a Night", 78),
        ]}
      />
      <Specimen label="Empty shortlist">
        <ConceptShortlist canChoose concepts={[]} />
      </Specimen>
      <Specimen label="Receipt">
        <div className="w-full max-w-lg border p-4">
          <ReceiptBody receipt={RECEIPT} />
        </div>
      </Specimen>
    </GallerySection>
  )
}
