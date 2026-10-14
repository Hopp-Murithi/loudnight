"use client"

import Link from "next/link"
import { DetailSheet } from "@/components/shared/detail-sheet"
import { ErrorState } from "@/components/shared/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import { WEEKDAY_LABELS, type Weekday } from "@/config/venues"
import { formatMoney } from "@/lib/format"
import { VENUE_ROLE_LABELS } from "@/modules/team/team.schemas"
import { useAdminVenue } from "../hooks/use-admin"
import { Initials, SignInBadge, VenueStatus } from "./admin-badges"
import { VenueSuspension } from "./venue-suspension"

const day = (iso: string | null, timeZone: string) =>
  iso ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone }).format(new Date(iso)) : "Never"

function Fact({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-muted/50 p-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="font-display text-2xl leading-tight font-bold tabular-nums">{value}</dd>
    </div>
  )
}

// One venue in full: its state, team, room and what it has done, with the actions an administrator can take.
export function VenueSheet({ venueId, onClose }: { venueId: string | null; onClose: () => void }) {
  const detail = useAdminVenue(venueId)
  const data = detail.data
  return (
    <DetailSheet
      open={venueId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={data?.venue.name ?? "Venue"}
      description={data ? data.venue.place : "Loading the venue"}
    >
      {detail.isError ? (
        <ErrorState
          title="This venue did not load"
          description="Check the connection, then try again."
          onRetry={() => detail.refetch()}
        />
      ) : !data ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <VenueStatus suspended={data.venue.suspendedAt !== null} />
            <Button size="sm" variant="ghost" nativeButton={false} render={<Link href={ROUTES.venue(data.venue.id)} />}>
              Open the venue
            </Button>
          </div>
          <dl className="grid grid-cols-2 gap-2">
            <Fact label="Plans" value={data.activity.plans} />
            <Fact label="Nights published" value={data.activity.publishedNights} />
            <Fact label="RSVPs" value={data.activity.rsvps} />
            <Fact label="Check-ins" value={data.activity.checkins} />
          </dl>
          <p className="text-sm text-muted-foreground">
            Added {day(data.venue.createdAt, data.venue.timeZone)}. Last plan{" "}
            {day(data.activity.lastPlanAt, data.venue.timeZone)}.
          </p>
          {data.settings && (
            <section className="space-y-1 text-sm">
              <h3 className="font-medium">The room</h3>
              <p className="text-muted-foreground">
                Quiet nights: {data.settings.quietNights.map((night) => WEEKDAY_LABELS[night as Weekday]).join(", ")}.
                Holds {data.settings.capacity}, breaks even at {data.settings.breakEven}. Talent budget{" "}
                {formatMoney(data.settings.talentBudgetCents, data.venue.currency)}.
              </p>
            </section>
          )}
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Team ({data.team.length})</h3>
            <ul className="divide-y border">
              {data.team.map((member) => (
                <li key={member.id} className="flex flex-wrap items-center gap-3 p-3">
                  <Initials name={member.name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium break-words">{member.name}</p>
                    <p className="text-xs break-all text-muted-foreground">
                      {VENUE_ROLE_LABELS[member.role as keyof typeof VENUE_ROLE_LABELS] ?? member.role}
                      {member.email ? `, ${member.email}` : ""}
                    </p>
                  </div>
                  <SignInBadge state={member.state} />
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Suspension</h3>
            <VenueSuspension venue={data.venue} />
          </section>
        </div>
      )}
    </DetailSheet>
  )
}
