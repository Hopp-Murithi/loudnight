"use client"

import Link from "next/link"
import { DetailSheet } from "@/components/shared/detail-sheet"
import { ErrorState } from "@/components/shared/error-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ROLES } from "@/config/roles"
import { ROUTES } from "@/config/site"
import { VENUE_ROLE_LABELS } from "@/modules/team/team.schemas"
import { useAdminPerson, useSetPersonActive } from "../hooks/use-admin"
import { PersonStatus, SignInBadge } from "./admin-badges"

const when = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(
        new Date(iso),
      )
    : "Never"

// One person: how they sign in, where they work and in what role, and deactivate or reactivate.
export function PersonSheet({
  personId,
  myId,
  onClose,
}: {
  personId: string | null
  myId: string
  onClose: () => void
}) {
  const detail = useAdminPerson(personId)
  const setActive = useSetPersonActive(personId ?? "")
  const data = detail.data
  const canChange = data && data.person.role !== ROLES.administrator && data.person.id !== myId
  const change = () => {
    if (!data) return
    const question = data.person.isActive
      ? `Deactivate ${data.person.name}? They are signed out everywhere and lose access to every venue until reactivated.`
      : `Reactivate ${data.person.name}? They can sign in and use their venues again.`
    if (window.confirm(question)) setActive.mutate(!data.person.isActive)
  }

  return (
    <DetailSheet
      open={personId !== null}
      onOpenChange={(open) => !open && onClose()}
      title={data?.person.name ?? "Person"}
      description={data?.person.email ?? (data ? "No email yet" : "Loading")}
    >
      {detail.isError ? (
        <ErrorState
          title="This person did not load"
          description="Check the connection, then try again."
          onRetry={() => detail.refetch()}
        />
      ) : !data ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <PersonStatus active={data.person.isActive} role={data.person.role} />
            <SignInBadge state={data.state} />
          </div>
          <p className="text-sm text-muted-foreground">
            Joined {when(data.person.createdAt)}. Last signed in {when(data.lastSignInAt)}. Times in UTC.
          </p>
          <section className="space-y-2">
            <h3 className="text-sm font-medium">Venues ({data.venues.length})</h3>
            {data.venues.length === 0 ? (
              <p className="text-sm text-muted-foreground">Not on any venue&apos;s team.</p>
            ) : (
              <ul className="divide-y border">
                {data.venues.map((venue) => (
                  <li key={venue.id} className="flex items-center justify-between gap-3 p-3 text-sm">
                    <Link
                      href={ROUTES.venue(venue.id)}
                      className="font-medium text-link underline-offset-4 hover:underline"
                    >
                      {venue.name}
                    </Link>
                    <span className="text-muted-foreground">
                      {VENUE_ROLE_LABELS[venue.role as keyof typeof VENUE_ROLE_LABELS] ?? venue.role}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {canChange && (
            <Button
              variant={data.person.isActive ? "outline" : "default"}
              disabled={setActive.isPending}
              onClick={change}
            >
              {setActive.isPending ? "Saving" : data.person.isActive ? "Deactivate" : "Reactivate"}
            </Button>
          )}
        </div>
      )}
    </DetailSheet>
  )
}
