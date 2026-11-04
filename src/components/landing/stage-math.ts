// The landing stage is driven by one number: where the story is, from 0 (the first scene) to the last scene's index.
// Everything that moves is worked out from it here, so it can be tested.

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

// 0 before `from`, 1 after `to`, eased in between.
function stretch(position: number, from: number, to: number): number {
  const t = clamp((position - from) / (to - from))
  return t * t * (3 - 2 * t)
}

export const sceneAt = (position: number) => Math.round(position)

// Where one gesture goes from the scene the story is on or heading to: the next scene in its direction, never two.
// Null past either end, so the page scrolls on normally to the footer.
export function stepTarget(scene: number, direction: number, scenes: number): number | null {
  if (direction === 0) return null
  const target = scene + Math.sign(direction)
  return target < 0 || target > scenes - 1 ? null : target
}

// A finger has to travel this far before a swipe counts, so a tap or a wobble never moves the story.
export const SWIPE_PX = 36

// Which way a swipe is going: 1 for up the screen (the next scene), -1 for down, 0 while it is still too short.
export const swipeStep = (startY: number, y: number) => (Math.abs(startY - y) < SWIPE_PX ? 0 : Math.sign(startY - y))

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

// The glide between scenes: slow out of the start, quick through the middle, gentle into the next scene.
export const easeInOut = (t: number) => {
  const x = clamp(t)
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
}

// The scene a key press moves to, or null when the key is not one that moves the story.
export function keyTarget(scene: number, key: string, scenes: number): number | null {
  const step =
    key === "ArrowDown" || key === "PageDown" || key === " " ? 1 : key === "ArrowUp" || key === "PageUp" ? -1 : 0
  return stepTarget(scene, step, scenes)
}
