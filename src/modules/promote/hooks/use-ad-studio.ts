"use client"

import { useMutation } from "@tanstack/react-query"
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react"
import { showApiError } from "@/components/forms/api-errors"
import { adPhotoFor } from "@/config/night-photos"
import { AD_DEFAULT, AD_FORMATS, type AdFormatId } from "@/config/promote"
import { promoteApi } from "../api"
import { adContent } from "../promote.copy"
import { qrMatrix } from "../promote.qr"
import { adFonts, collage, loadImage, paintAd, type AdScene } from "../promote.render"
import { adDesignSchema, type AdDesign, type PromoBoard } from "../promote.schemas"
import { STILL } from "../promote.timeline"

const SAVE_AFTER_MS = 900
const optimised = (url: string) => `/_next/image?url=${encodeURIComponent(url)}&w=1080&q=75`
const prefersStill = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches

// Holds the owner's choices for one night's ad, keeps the preview painted, and saves the design a moment after it changes.
export function useAdStudio(board: PromoBoard, canEdit: boolean, canvasRef: RefObject<HTMLCanvasElement | null>) {
  const [nightId, setNightId] = useState(board.nights[0].id)
  const [formatId, setFormatId] = useState<AdFormatId>("poster")
  const [designs, setDesigns] = useState(() => new Map(board.nights.map((night) => [night.id, night.design])))
  const [ownPhoto, setOwnPhoto] = useState<string | null>(null)
  const [take, setTake] = useState(0)
  const [assets, setAssets] = useState<{ fonts: AdScene["fonts"]; image: HTMLImageElement | null; key: string } | null>(
    null,
  )
  const saved = useRef(new Map(board.nights.map((night) => [night.id, night.design])))
  const latest = useRef<AdScene | null>(null)
  const played = useRef("")
  const running = useRef(0)
  const { mutate: save } = useMutation({
    mutationFn: ({ id, design }: { id: string; design: AdDesign }) => promoteApi.saveDesign(id, design),
    onError: (error) => showApiError(error),
  })

  const night = board.nights.find((entry) => entry.id === nightId) ?? board.nights[0]
  const design = designs.get(night.id) ?? night.design
  const format = AD_FORMATS.find((entry) => entry.id === formatId) ?? AD_FORMATS[0]
  const content = useMemo(() => adContent(board, { ...night, design }), [board, night, design])

  const qr = useMemo(() => (content.link ? qrMatrix(content.link) : null), [content.link])

  // Up to three booked acts with photos, in the order they said yes. One fills the photo; two or three share it.
  const actPhotos = board.acts.flatMap((act) => (act.imageUrl ? [optimised(act.imageUrl)] : [])).slice(0, 3)
  const actPhoto = actPhotos.at(-1) ?? null
  const mood = adPhotoFor(board.venue.id, night.sequence).image.src
  const photoSrc = design.photo === "own" ? (ownPhoto ?? mood) : design.photo === "act" ? (actPhoto ?? mood) : mood
  const photoKey = design.photo === "act" && actPhotos.length > 1 ? actPhotos.join(" ") : photoSrc

  useEffect(() => {
    let current = true
    const sources = photoKey.split(" ")
    const photo =
      sources.length > 1
        ? Promise.all(sources.map(loadImage)).then((images) => {
            const loaded = images.filter((image): image is HTMLImageElement => image !== null)
            return loaded.length > 1 ? collage(loaded) : (loaded[0] ?? null)
          })
        : loadImage(photoKey)
    // A photo that will not load gives way to the night photo, so the ad is never left with an empty panel.
    void Promise.all([adFonts(), photo.then((image) => image ?? loadImage(mood))]).then(([fonts, image]) => {
      if (current) setAssets({ fonts, image, key: photoKey })
    })
    return () => {
      current = false
    }
  }, [mood, photoKey])

  const scene: AdScene | null = useMemo(
    () => (assets ? { content, design, format, image: assets.image, fonts: assets.fonts, qr } : null),
    [assets, content, design, format, qr],
  )

  // The six seconds play when the night, shape or layout changes. Smaller edits repaint the finished frame at once.
  const playKey = `${night.id}|${format.id}|${design.template}|${take}`
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !scene) return
    latest.current = scene
    if (played.current === playKey || prefersStill()) {
      if (played.current === playKey && running.current) return
      played.current = playKey
      paintAd(canvas, scene, STILL)
      return
    }
    played.current = playKey
    cancelAnimationFrame(running.current)
    const started = performance.now()
    running.current = requestAnimationFrame(function tick(now) {
      const t = (now - started) / 1000
      if (latest.current) paintAd(canvas, latest.current, Math.min(t, STILL))
      running.current = t < STILL ? requestAnimationFrame(tick) : 0
    })
  }, [canvasRef, playKey, scene])
  useEffect(() => () => cancelAnimationFrame(running.current), [])

  // Each change builds on the newest design, so two quick taps never overwrite one another.
  const change = useCallback(
    (patch: Partial<AdDesign>) =>
      setDesigns((current) => {
        const base = current.get(night.id) ?? night.design
        return new Map(current).set(night.id, { ...base, ...patch })
      }),
    [night.id, night.design],
  )

  // Saved a moment after the last change, and only when it differs from what the server already has.
  useEffect(() => {
    if (!canEdit || saved.current.get(night.id) === design || !adDesignSchema.safeParse(design).success) return
    const timer = setTimeout(() => {
      saved.current.set(night.id, design)
      save({ id: night.id, design })
    }, SAVE_AFTER_MS)
    return () => clearTimeout(timer)
  }, [canEdit, design, night.id, save])

  const chooseOwnPhoto = useCallback(
    (file: File) => {
      setOwnPhoto((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return URL.createObjectURL(file)
      })
      change({ photo: "own" })
    },
    [change],
  )

  const replay = useCallback(() => setTake((count) => count + 1), [])
  const startOver = useCallback(() => change({ ...AD_DEFAULT }), [change])

  return {
    replay,
    startOver,
    night,
    setNightId,
    format,
    setFormatId,
    design,
    change,
    chooseOwnPhoto,
    content,
    scene,
    hasActPhoto: actPhoto !== null,
    hasOwnPhoto: ownPhoto !== null,
  }
}
