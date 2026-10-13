"use client"

import { useQueryClient } from "@tanstack/react-query"
import { useCallback, useEffect, useRef, useState } from "react"
import type { PipelineStep } from "@/config/runs"
import { AppError } from "@/lib/http/errors"
import { runsApi } from "../api"
import type { RunEvent, RunView, StepView, ToolLine } from "../runs.schemas"

interface LiveStep {
  tools: ToolLine[]
  findings: string[]
}

const BUSY_WAIT_MS = 3_000
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Drives a run one step per request, in order. A reload resumes where the stored run left off.
export function useRun(initial: RunView, canRun: boolean) {
  const queryClient = useQueryClient()
  const [view, setView] = useState(initial)
  const [live, setLive] = useState<Partial<Record<PipelineStep, LiveStep>>>({})
  const [error, setError] = useState<{ step: PipelineStep; message: string } | null>(null)
  const [driving, setDriving] = useState(false)
  const lock = useRef(false)

  const onEvent = useCallback((event: RunEvent) => {
    if (event.type !== "tool" && event.type !== "finding") return
    setLive((current) => {
      const step = current[event.step] ?? { tools: [], findings: [] }
      const next =
        event.type === "tool"
          ? { ...step, tools: [...step.tools, event.line] }
          : { ...step, findings: [...step.findings, event.text] }
      return { ...current, [event.step]: next }
    })
  }, [])

  const drive = useCallback(async () => {
    if (lock.current) return
    lock.current = true
    setDriving(true)
    setError(null)
    try {
      let latest = await runsApi.view(initial.id)
      setView(latest)
      for (let pending = latest.steps.find((step) => step.status !== "done"); pending;) {
        const step = pending.step
        setLive((current) => ({ ...current, [step]: { tools: [], findings: [] } }))
        const failure = { message: null as string | null }
        try {
          await runsApi.step(initial.id, step, (event) => {
            if (event.type === "error") failure.message = event.message
            onEvent(event)
          })
        } catch (caught) {
          if (!(caught instanceof AppError && caught.code === "conflict")) throw caught
          await wait(BUSY_WAIT_MS)
        }
        latest = await runsApi.view(initial.id)
        setView(latest)
        setLive((current) => ({ ...current, [step]: undefined }))
        const stored = latest.steps.find((entry) => entry.step === step)
        if (failure.message || stored?.status === "failed") {
          setError({ step, message: failure.message ?? latest.errorMessage ?? "This step did not finish." })
          return
        }
        if (step === "score") await queryClient.invalidateQueries({ queryKey: ["shortlist", initial.id] })
        pending = latest.steps.find((entry) => entry.status !== "done")
      }
    } catch (caught) {
      setError({ step: "scout", message: caught instanceof AppError ? caught.message : "The plan could not continue." })
    } finally {
      lock.current = false
      setDriving(false)
    }
  }, [initial.id, onEvent, queryClient])

  // Started on the next tick and cancelled on unmount, so the development double mount never starts it twice.
  useEffect(() => {
    if (!canRun || initial.status === "succeeded") return
    const timer = setTimeout(() => void drive(), 0)
    return () => clearTimeout(timer)
  }, [canRun, drive, initial.status])

  const steps: StepView[] = view.steps.map((step) => {
    const now = live[step.step]
    return now ? { ...step, status: "running", tools: now.tools, findings: now.findings } : step
  })

  return { view, steps, error, driving, retry: drive, finished: view.status === "succeeded" }
}
