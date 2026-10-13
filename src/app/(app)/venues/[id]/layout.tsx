import { getPageContext } from "@/modules/auth/server/context"
import { VenueBanner } from "@/modules/venues/components/venue-banner"
import { venueForPage } from "@/modules/venues/venues.page"

// Every page under a venue shares its banner. The venue read is cached, so pages reading it again cost nothing.
export default async function VenueLayout({ children, params }: LayoutProps<"/venues/[id]">) {
  const venue = await venueForPage(await getPageContext(), (await params).id)
  return (
    <>
      <VenueBanner venue={venue} />
      {children}
    </>
  )
}
