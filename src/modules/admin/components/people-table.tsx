"use client"

import { ChevronRight } from "lucide-react"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { AdminPerson } from "../admin.schemas"
import { Initials, PersonStatus } from "./admin-badges"
import { PersonSheet } from "./person-sheet"

const joined = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso))
const contact = (person: AdminPerson) => (person.isAnonymous ? "Signed in without an email yet" : person.email)

// Everyone as a table on wider screens and as cards on a phone; a row opens their details beside the list.
export function PeopleTable({ people, myId }: { people: AdminPerson[]; myId: string }) {
  const [open, setOpen] = useState<string | null>(null)
  return (
    <>
      <div className="hidden border bg-card md:block">
        <Table>
          <TableHeader className="sticky top-0 bg-muted/70 backdrop-blur">
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10">
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => (
              <TableRow
                key={person.id}
                onClick={() => setOpen(person.id)}
                data-inactive={!person.isActive}
                className="cursor-pointer transition-colors hover:bg-primary/5 data-[inactive=true]:bg-destructive/5"
              >
                <TableCell>
                  <button
                    type="button"
                    className="flex items-center gap-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Initials name={person.name} />
                    <span className="min-w-0">
                      <span className="block font-medium">
                        {person.name}
                        {person.id === myId && <span className="text-muted-foreground"> (you)</span>}
                      </span>
                      <span className="block text-xs break-all text-muted-foreground">{contact(person)}</span>
                    </span>
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{joined(person.createdAt)}</TableCell>
                <TableCell>
                  <PersonStatus active={person.isActive} role={person.role} />
                </TableCell>
                <TableCell>
                  <ChevronRight aria-hidden className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="grid gap-2 md:hidden">
        {people.map((person) => (
          <li key={person.id}>
            <button
              type="button"
              onClick={() => setOpen(person.id)}
              className="flex w-full items-center gap-3 border bg-card p-3 text-left outline-none hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Initials name={person.name} />
              <span className="min-w-0 flex-1">
                <span className="block font-medium break-words">{person.name}</span>
                <span className="block text-xs break-all text-muted-foreground">{contact(person)}</span>
                <span className="mt-2 block">
                  <PersonStatus active={person.isActive} role={person.role} />
                </span>
              </span>
              <ChevronRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>
      <PersonSheet personId={open} myId={myId} onClose={() => setOpen(null)} />
    </>
  )
}
