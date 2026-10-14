import "server-only"
import { cookies } from "next/headers"
import { PREVIEW_COOKIE, PREVIEW_MAX_AGE_SECONDS } from "@/config/site"
import { isConfigured, previewEnv } from "@/lib/env/server"
import { readPreview, signPreview } from "./preview.token"

// Who the administrator is previewing, from a valid cookie; null otherwise or when previews are not set up.
export async function previewTarget(): Promise<string | null> {
  if (!isConfigured("preview")) return null
  const token = (await cookies()).get(PREVIEW_COOKIE)?.value
  return readPreview(token, previewEnv().PREVIEW_COOKIE_SECRET)?.target ?? null
}

export async function setPreviewCookie(target: string): Promise<{ previewing: true }> {
  const exp = Date.now() + PREVIEW_MAX_AGE_SECONDS * 1000
  ;(await cookies()).set(PREVIEW_COOKIE, signPreview({ target, exp }, previewEnv().PREVIEW_COOKIE_SECRET), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PREVIEW_MAX_AGE_SECONDS,
  })
  return { previewing: true }
}

export async function clearPreviewCookie(): Promise<{ previewing: false }> {
  ;(await cookies()).delete(PREVIEW_COOKIE)
  return { previewing: false }
}
