"use client"

import { useCallback, useEffect, useState, type RefObject } from "react"
import { sceneAt, stageVars, storyPosition } from "./stage-math"

// Pins the stage and turns the page's scroll into the story's position. The values are written straight onto the
// stage each frame, so scrolling never re-renders React; only a change of scene does.
export function useScrollStage(
  trackRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  scenes: number,
) {
  const [scene, setScene] = useState(0)

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const track = trackRef.current
      const stage = stageRef.current
      if (!track || !stage) return
      const top = track.getBoundingClientRect().top + window.scrollY
      const position = storyPosition(window.scrollY, top, track.offsetHeight, window.innerHeight, scenes)
      for (const [name, value] of Object.entries(stageVars(position, scenes))) stage.style.setProperty(name, value)
      setScene(sceneAt(position))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [scenes, stageRef, trackRef])

  // Jumps to a scene, for the dots beside the stage and for keyboard users.
  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current
      if (!track) return
      const top = track.getBoundingClientRect().top + window.scrollY
      const travel = track.offsetHeight - window.innerHeight
      window.scrollTo({ top: top + (travel * index) / (scenes - 1) })
    },
    [scenes, trackRef],
  )

  return { scene, goTo }
}
