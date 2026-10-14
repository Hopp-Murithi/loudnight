import { DoorOpen } from "lucide-react"
import type { Metadata } from "next"
import { PageHeader } from "@/components/layout/page-header"
import { ROUTES } from "@/config/site"
import { formatNightTime } from "@/lib/format"
import { getPageContext } from "@/modules/auth/server/context"
import { DoorQr } from "@/modules/door/components/door-qr"
import { DoorScreen } from "@/modules/door/components/door-screen"
import { readDoor } from "@/modules/door/door.service"
import { DoorPreview } from "@/modules/series/components/door-preview"
import { StageEmpty } from "@/modules/series/components/stage-empty"
import { venueForPage } from "@/modules/venues/venues.page"

export const metadata: Metadata = { title: "Door" }

export default async function VenueDoorPage({ params }: PageProps<"/venues/[id]/door">) {
  const ctx = await getPageContext()
  const venue = await venueForPage(ctx, (await params).id)
  const door = await readDoor(ctx, venue.id)

  if (!door)
    return (
      <>
        <PageHeader title="Door" description="Check guests in on the night, by name or by their QR code." />
        <StageEmpty
          icon={DoorOpen}
          title="No night is on yet"
          description="When a night is published, its guest list opens here. Every check-in counts toward break-even, live."
          action={venue.role === "door" ? undefined : { label: "See the series", href: ROUTES.venueSeries(venue.id) }}
        >
          <DoorPreview breakEven={venue.settings?.breakEvenHeadcount ?? null} />
        </StageEmpty>
      </>
    )

  return (
    <>
      <PageHeader
        title={door.night.title}
        description={`The door, ${formatNightTime(door.night.startsAt, venue.timeZone)}. Counts update live on every phone.`}
      />
      <DoorScreen initial={door} />
      {venue.role !== "door" && <DoorQr slug={door.night.slug} title={door.night.title} />}
    </>
  )
}
