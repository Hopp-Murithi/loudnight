"use client"

import { CircleAlert, CircleCheck } from "lucide-react"
import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { ApiError } from "@/lib/http/client"
import { cn } from "@/lib/utils"
import type { CheckinInput, CheckinResult, DoorView } from "../door.schemas"
import { useCheckIn, useDoor } from "../hooks/use-door"
import { DoorCount, RecentArrivals } from "./door-tally"
import { DoorScanner } from "./door-scanner"
import { GuestFinder } from "./guest-finder"
import { PartyStepper } from "./party-stepper"
import { formatClock } from "@/lib/format"

type Mode = "scan" | "list" | "walk-in"
const MODES: { id: Mode; label: string }[] = [
  { id: "scan", label: "Scan a ticket" },
  { id: "list", label: "Find a name" },
  { id: "walk-in", label: "Walk-in" },
]

type Feedback = { tone: "good" | "warn"; text: string } | null

function feedbackFor(result: CheckinResult, timeZone: string): Feedback {
  const who = result.partySize > 1 ? `${result.name}, party of ${result.partySize}` : result.name
  return result.status === "in"
    ? { tone: "good", text: `${who}: in` }
    : { tone: "warn", text: `${who} already came in at ${formatClock(result.at, timeZone)}` }
}

// The door on the night: one big live count, then scan, find a name, or count a walk-in. Built for a thumb.
export function DoorScreen({ initial }: { initial: DoorView }) {
  const door = useDoor(initial)
  const checkIn = useCheckIn(door.night.id)
  const [mode, setMode] = useState<Mode>("scan")
  const [party, setParty] = useState(1)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const { numbers, breakEven } = door
  const timeZone = door.night.timeZone

  const send = useCallback(
    (input: CheckinInput) =>
      checkIn.mutate(input, {
        onSuccess: (result) => {
          setFeedback(feedbackFor(result, timeZone))
          navigator.vibrate?.(result.status === "in" ? 60 : [40, 60, 40])
        },
        onError: (error) =>
          setFeedback({ tone: "warn", text: error instanceof ApiError ? error.message : "That did not go through." }),
      }),
    [checkIn, timeZone],
  )
  const onCode = useCallback((code: string) => send({ code }), [send])

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <DoorCount numbers={numbers} breakEven={breakEven} />

      <div role="status" aria-live="assertive" className="min-h-14">
        {feedback && (
          <p
            className={cn(
              "flex items-center gap-2 border-l-4 p-3 text-lg font-medium",
              feedback.tone === "good" ? "border-success bg-success/12" : "border-warning bg-warning/14",
            )}
          >
            {feedback.tone === "good" ? (
              <CircleCheck aria-hidden className="size-6 text-success" />
            ) : (
              <CircleAlert aria-hidden className="size-6 text-warning" />
            )}
            {feedback.text}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="How this guest is checked in">
        {MODES.map((entry) => (
          <Button
            key={entry.id}
            role="tab"
            aria-selected={mode === entry.id}
            variant={mode === entry.id ? "default" : "outline"}
            className="h-12 px-2"
            onClick={() => setMode(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
      </div>

      <div role="tabpanel">
        {mode === "scan" && <DoorScanner onCode={onCode} busy={checkIn.isPending} />}
        {mode === "list" && (
          <GuestFinder
            guests={door.guests}
            timeZone={door.night.timeZone}
            busy={checkIn.isPending}
            onCheckIn={(rsvpId) => send({ rsvpId })}
          />
        )}
        {mode === "walk-in" && (
          <div className="space-y-4 border p-5">
            <PartyStepper value={party} onChange={setParty} label="People walking in" />
            <Button
              size="lg"
              className="h-12 w-full"
              disabled={checkIn.isPending}
              onClick={() => send({ walkIn: true, partySize: party })}
            >
              Count {party === 1 ? "1 walk-in" : `${party} walk-ins`}
            </Button>
          </div>
        )}
      </div>

      <RecentArrivals arrivals={door.recent} timeZone={door.night.timeZone} />
    </div>
  )
}
