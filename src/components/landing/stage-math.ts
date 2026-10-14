// The landing stage is driven by one number: how far through the story the visitor has scrolled, from 0 (the first
// scene) to the last scene's index. Everything that moves is worked out from it here, so it can be tested.

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

// 0 before `from`, 1 after `to`, eased in between.
function stretch(position: number, from: number, to: number): number {
  const t = clamp((position - from) / (to - from))
  return t * t * (3 - 2 * t)
}

// How far through the story a scroll position is, given where the stage starts and how tall it is.
export function storyPosition(scrollY: number, top: number, height: number, viewport: number, scenes: number): number {
  const travel = Math.max(1, height - viewport)
  return clamp((scrollY - top) / travel) * (scenes - 1)
}

export const sceneAt = (position: number) => Math.round(position)

// Where one wheel gesture goes: the next scene in its direction. Null past either end, so the page scrolls on
// normally to the footer or back to the top.
export function wheelTarget(position: number, deltaY: number, scenes: number): number | null {
  if (deltaY === 0) return null
  const target = sceneAt(position) + Math.sign(deltaY)
  return target < 0 || target > scenes - 1 ? null : target
}

// The style values the stage's layers read. Pictures cross-fade straight into each other, so no frame is ever empty.
export function stageVars(position: number, scenes: number): Record<string, string> {
  const vars: Record<string, string> = {}
  for (let index = 0; index < scenes; index += 1) {
    vars[`--v${index}`] = clamp(1 - Math.abs(position - index)).toFixed(3)
    // Words hand over faster than pictures, so two headlines are never on screen together.
    vars[`--t${index}`] = clamp(1 - Math.abs(position - index) * 3.2).toFixed(3)
  }
  // The world closes in on the visitor's country, the country on its main town, the room comes into focus, then the world again.
  vars["--world-zoom"] = (1 + 7 * stretch(position, 0, 1)).toFixed(3)
  vars["--area-zoom"] = (0.55 + 0.45 * stretch(position, 0.45, 1) + 3.5 * stretch(position, 1, 2)).toFixed(3)
  vars["--room-zoom"] = (1.35 - 0.35 * stretch(position, 1.4, 2.4)).toFixed(3)
  vars["--finale-zoom"] = (1.25 - 0.25 * stretch(position, 3.3, 4)).toFixed(3)
  return vars
}
