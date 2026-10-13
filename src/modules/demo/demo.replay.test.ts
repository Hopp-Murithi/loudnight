import { describe, expect, it } from "vitest"
import type { StepView } from "@/modules/runs/runs.schemas"
import { replayFrame } from "./demo.replay"

const step = (name: StepView["step"]): StepView => ({
  step: name,
  status: "done",
  tools: [],
  findings: [`${name} finding`],
  latencyMs: 500,
})
const steps = [step("scout"), step("read_neighbourhood"), step("find_gap")]

describe("replayFrame", () => {
  it("shows the finished trace when nothing is playing, which is what reduced motion and Skip use", () => {
    expect(replayFrame(steps, null)).toBe(steps)
    expect(replayFrame(steps, 3)).toBe(steps)
  })

  it("shows earlier steps finished, the current one running and later ones waiting with nothing revealed", () => {
    const frame = replayFrame(steps, 1)
    expect(frame.map((item) => item.status)).toEqual(["done", "running", "pending"])
    expect(frame[1].findings).toEqual(["read_neighbourhood finding"])
    expect(frame[2].findings).toEqual([])
  })
})
