"use client"

import { useCallback, useEffect, useState, type RefObject } from "react"
import { sceneAt, stageVars, storyPosition, wheelTarget } from "./stage-math"

// A wheel or trackpad gesture counts as over once its events stop for this long; one gesture moves one scene.
const GESTURE_GAP_MS = 220

function measure(track: HTMLElement, scenes: number) {
  const top = track.getBoundingClientRect().top + window.scrollY
  const travel = track.offsetHeight - window.innerHeight
  const position = storyPosition(window.scrollY, top, track.offsetHeight, window.innerHeight, scenes)
  return { top, travel, position, inside: window.scrollY >= top - 1 && window.scrollY <= top + travel + 1 }
}

// Pins the stage and turns the page's scroll into the story's position. The values are written straight onto the
// stage each frame, so scrolling never re-renders React; only a change of scene does. A mouse wheel or trackpad moves
// exactly one scene per gesture; touch and the keyboard use the browser's own snapping.
export function useScrollStage(
  trackRef: RefObject<HTMLElement | null>,
  stageRef: RefObject<HTMLElement | null>,
  scenes: number,
) {
  const [scene, setScene] = useState(0)

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current
      if (!track) return
      const { top, travel } = measure(track, scenes)
      window.scrollTo({ top: top + (travel * index) / (scenes - 1) })
    },
    [scenes, trackRef],
  )

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const track = trackRef.current
      const stage = stageRef.current
      if (!track || !stage) return
      const { position } = measure(track, scenes)
      for (const [name, value] of Object.entries(stageVars(position, scenes))) stage.style.setProperty(name, value)
      setScene(sceneAt(position))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    let moving = false
    let quiet = 0
    const onWheel = (event: WheelEvent) => {
      const track = trackRef.current
      if (!track || event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      const { position, inside } = measure(track, scenes)
      const target = inside ? wheelTarget(position, event.deltaY, scenes) : null
      if (target === null) return
      event.preventDefault()
      window.clearTimeout(quiet)
      quiet = window.setTimeout(() => {
        moving = false
      }, GESTURE_GAP_MS)
      if (moving) return
      moving = true
      goTo(target)
    }

    update()
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    window.addEventListener("wheel", onWheel, { passive: false })
    return () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(quiet)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("wheel", onWheel)
    }
  }, [goTo, scenes, stageRef, trackRef])

  return { scene, goTo }
}
