import { ROUTES, SIGNED_IN_HOME } from "@/config/site"
import type { LinkType } from "./auth.schemas"

// Every emailed link opens our confirm page, which posts the token with a button press.
export function confirmLinkUrl(appUrl: string, tokenHash: string, type: LinkType): string {
  const url = new URL(ROUTES.authConfirm, appUrl)
  url.searchParams.set("token_hash", tokenHash)
  url.searchParams.set("type", type)
  return url.toString()
}

export const absoluteUrl = (appUrl: string, path: string) => new URL(path, appUrl).toString()

// Sign-up and resent confirmation links sign the person straight in; reset and invite links need a password first.
export const needsPassword = (type: LinkType) => type === "recovery" || type === "invite"

export const afterConfirm = (type: LinkType) => (needsPassword(type) ? ROUTES.setPassword : SIGNED_IN_HOME)
