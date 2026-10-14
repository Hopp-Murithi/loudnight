import { describe, expect, it } from "vitest"
import { AD_VIDEO } from "@/config/promote"
import { fitTitle, motionAt, phase, STILL, videoType, wrapLines } from "./promote.timeline"

describe("phase", () => {
  it("is nothing before a move starts, everything after it ends, and eased in between", () => {
    expect(phase(0, 1, 2)).toBe(0)
    expect(phase(3, 1, 2)).toBe(1)
    expect(phase(1.5, 1, 2)).toBeGreaterThan(0.5)
  })
})

describe("motionAt", () => {
  it("starts with nothing but the photo, and ends with everything in place", () => {
    const start = motionAt(0)
    expect([start.zoom, start.title(0), start.band, start.detail]).toEqual([1, 0, 0, 0])
    const end = motionAt(STILL)
    expect(end.zoom).toBeCloseTo(1 + AD_VIDEO.zoom)
    expect([end.title(0), end.title(2), end.band, end.detail]).toEqual([1, 1, 1, 1])
  })

  it("brings title lines in one after another", () => {
    const early = motionAt(0.6)
    expect(early.title(0)).toBeGreaterThan(early.title(1))
  })

  it("never zooms past its limit, however long it runs", () => {
    expect(motionAt(60).zoom).toBeCloseTo(1 + AD_VIDEO.zoom)
  })
})

describe("videoType", () => {
  it("prefers MP4, which every network accepts", () => {
    expect(videoType(() => true)?.extension).toBe("mp4")
  })

  it("falls back to WebM, and to nothing when the browser cannot record", () => {
    expect(videoType((mime) => mime.startsWith("video/webm"))?.extension).toBe("webm")
    expect(videoType(() => false)).toBeNull()
  })
})

const narrow = (limit: number) => (line: string) => line.length <= limit

describe("wrapLines", () => {
  it("breaks at words into as few lines as fit", () => {
    expect(wrapLines(["Low", "Light", "Tuesdays"], 3, narrow(10))).toEqual(["Low Light", "Tuesdays"])
  })

  it("gives up when a word is too long or there are too many lines", () => {
    expect(wrapLines(["Extraordinarily"], 3, narrow(10))).toBeNull()
    expect(wrapLines(["a", "b", "c"], 2, narrow(1))).toBeNull()
  })
})

describe("fitTitle", () => {
  const fits = (line: string, size: number) => line.length * size <= 1000

  it("uses the biggest size at which the name fits", () => {
    expect(fitTitle("Low Light Tuesdays", [200, 100, 50], 2, fits)).toEqual({
      size: 100,
      lines: ["Low Light", "Tuesdays"],
    })
  })

  it("steps down further when the block would be too tall for its space", () => {
    const shortSpace = (size: number, lineCount: number) => size * lineCount <= 120
    expect(fitTitle("Low Light Tuesdays", [200, 100, 50], 2, fits, shortSpace).size).toBe(50)
  })

  it("still draws something at the smallest size when nothing fits", () => {
    const result = fitTitle("Extraordinarily long", [200, 100], 1, () => false)
    expect(result.size).toBe(100)
    expect(result.lines.length).toBeGreaterThan(0)
  })
})
