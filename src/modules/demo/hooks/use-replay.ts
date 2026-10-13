"use client"

import { useCallback, useEffect, useState } from "react"
import type { StepView } from "@/modules/runs/runs.schemas"
import { REPLAY_STEP_MS, replayFrame } from "../demo.replay"

const prefersStill = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Plays a stored run back one step at a time. Reduced motion and Skip both jump straight to the finished trace.
export function useReplay(steps: StepView[]) {
  const [shown, setShown] = useState<number | null>(null)
  const playing = shown !== null && shown < steps.length

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => setShown((current) => (current === null ? null : current + 1)), REPLAY_STEP_MS)
    return () => clearTimeout(timer)
  }, [playing, shown])

  const play = useCallback(() => setShown(prefersStill() ? null : 0), [])
  const skip = useCallback(() => setShown(null), [])

  return { steps: replayFrame(steps, shown), playing, play, skip }
}
