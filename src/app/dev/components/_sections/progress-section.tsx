import { CircleCheck, Clock, DoorOpen, TriangleAlert, Users } from "lucide-react"
import { BrandLoader } from "@/components/shared/brand-loader"
import { KpiCard } from "@/components/shared/kpi-card"
import { MeterBar } from "@/components/shared/meter-bar"
import { Spinner } from "@/components/shared/spinner"
import { Stepper, type StepItem } from "@/components/shared/stepper"
import { ToneBadge } from "@/components/shared/tone-badge"
import { GallerySection, Specimen } from "./gallery-section"

const TRACE: StepItem[] = [
  {
    id: "scout",
    label: "Scouting the venue",
    status: "done",
    meta: "1.2s",
    detail: "Bar, rated 4.4, open until 2am. From Google Places.",
  },
  {
    id: "read",
    label: "Reading the neighbourhood",
    status: "done",
    meta: "6.8s",
    detail: "9 domains from Qloo, 14 calls, 9 from cache.",
  },
  { id: "gap", label: "Checking what's on nearby", status: "running", detail: "4 venues run trivia on Tuesdays." },
  { id: "concepts", label: "Inventing nights", status: "pending" },
  { id: "score", label: "Scoring and checking receipts", status: "pending" },
  {
    id: "plan",
    label: "Planning the series",
    status: "failed",
    detail: "Ticketmaster did not answer. Try again in a moment.",
  },
]

export function ProgressSection() {
  return (
    <GallerySection title="Status and progress" description="State always has words and an icon, never colour alone.">
      <Specimen label="Tone badges">
        <ToneBadge tone="success" icon={CircleCheck} label="Plan ready" />
        <ToneBadge tone="info" icon={Clock} label="Running" />
        <ToneBadge tone="warning" icon={Clock} label="Draft" />
        <ToneBadge tone="danger" icon={TriangleAlert} label="Cancelled" />
        <ToneBadge tone="neutral" icon={Clock} label="Plan being prepared" />
      </Specimen>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="RSVPs" value="46" hint="For Tuesday, Oct 20" icon={Users} tone="info" />
        <KpiCard label="Checked in" value="32" hint="8 to break even" icon={DoorOpen} tone="warning" meter={80} />
        <KpiCard label="Show-up rate" value="70%" hint="Of people who said yes" icon={CircleCheck} tone="success" />
        <KpiCard label="Break-even" value="40" hint="From your settings" icon={Users} />
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <MeterBar
          label="Checked in"
          value={32}
          max={60}
          target={40}
          valueText="32 of 40"
          targetLabel="The line marks break-even"
          tone="warning"
        />
        <MeterBar label="Afrobeats affinity" value={0.94} max={1} valueText="0.94" tone="success" />
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Specimen label="Stepper, every state">
          <Stepper steps={TRACE} className="w-full" />
        </Specimen>
        <Specimen label="Loaders">
          <Spinner />
          <BrandLoader label="Reading the neighbourhood" />
        </Specimen>
      </div>
    </GallerySection>
  )
}
