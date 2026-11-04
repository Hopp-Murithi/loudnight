"use client"

import { useCallback, useEffect, useRef, useState, type RefObject } from "react"
import { easeInOut, keyTarget, stageVars, stepTarget, swipeStep } from "./stage-math"

// Wheel events closer together than this are one gesture, a trackpad's momentum included; one gesture moves one scene.
const GESTURE_GAP_MS = 200
// One scene to the next, under the half second every animation keeps to.
const GLIDE_MS = 480

type Owner = "story" | "page"

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches
// The story takes gestures only while the stage fills the screen; below it, on the credits, the page scrolls as usual.
const stageInView = () => window.scrollY <= 1
const ownsKey = (target: EventTarget | null, key: string) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) ||
    (key === " " && /^(A|BUTTON)$/.test(target.tagName)))

// One gesture, swipe or key moves exactly one scene; a gesture mid-glide moves one on from where it was heading.
export function useSceneStage(stageRef: RefObject<HTMLElement | null>, scenes: number) {
  const [scene, setScene] = useState(0)
  const story = useRef({ position: 0, target: 0, frame: 0 })

  const paint = useCallback(
    (position: number) => {
      story.current.position = position
      const stage = stageRef.current
      if (!stage) return
      for (const [name, value] of Object.entries(stageVars(position, scenes))) stage.style.setProperty(name, value)
    },
    [scenes, stageRef],
  )

  const goTo = useCallback(
    (index: number) => {
      const current = story.current
      cancelAnimationFrame(current.frame)
      current.target = index
      setScene(index)
      if (reducedMotion()) return paint(index)
      const from = current.position
      const began = performance.now()
      const glide = (now: number) => {
        const progress = Math.min(1, (now - began) / GLIDE_MS)
        paint(from + (index - from) * easeInOut(progress))
        if (progress < 1) current.frame = requestAnimationFrame(glide)
      }
      current.frame = requestAnimationFrame(glide)
    },
    [paint],
  )

  useEffect(() => {
    const current = story.current
    // Moves one scene, or says the gesture runs past either end and so belongs to the page.
    const step = (direction: number): Owner => {
      const target = stepTarget(current.target, direction, scenes)
      if (target === null) return "page"
      goTo(target)
      return "story"
    }

    let wheel: Owner | null = null
    let lastWheel = Number.NEGATIVE_INFINITY
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.deltaY === 0 || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
      // Timed by the events themselves, so a busy phone that hands them over late still sees one gesture.
      if (event.timeStamp - lastWheel > GESTURE_GAP_MS) wheel = null
      lastWheel = event.timeStamp
      wheel ??= stageInView() ? step(event.deltaY) : "page"
      if (wheel === "story") event.preventDefault()
    }

    let touch: { startY: number; owner: Owner | null; moved: boolean } | null = null
    const onTouchStart = (event: TouchEvent) => {
      const point = event.touches.length === 1 ? event.touches[0] : undefined
      touch = point && stageInView() ? { startY: point.clientY, owner: null, moved: false } : null
    }
    const onTouchMove = (event: TouchEvent) => {
      const point = event.touches[0]
      if (!touch || !point || touch.owner === "page") return
      const travel = touch.startY - point.clientY
      if (touch.owner === null) {
        if (travel === 0) return
        // Only a swipe on to the credits past the last scene scrolls the page; the browser decides on the first move.
        touch.owner = travel > 0 && current.target === scenes - 1 ? "page" : "story"
        if (touch.owner === "page") return
      }
      event.preventDefault()
      const direction = touch.moved ? 0 : swipeStep(touch.startY, point.clientY)
      if (direction === 0) return
      touch.moved = true
      step(direction)
    }

    const onKey = (event: KeyboardEvent) => {
      if (ownsKey(event.target, event.key) || event.altKey || event.ctrlKey || event.metaKey || !stageInView()) return
      const target = keyTarget(current.target, event.key, scenes)
      if (target === null) return
      event.preventDefault()
      goTo(target)
    }

    window.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("touchstart", onTouchStart, { passive: true })
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("keydown", onKey)
    return () => {
      cancelAnimationFrame(current.frame)
      window.removeEventListener("wheel", onWheel)
      window.removeEventListener("touchstart", onTouchStart)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("keydown", onKey)
    }
  }, [goTo, scenes])

  return { scene, goTo }
}
