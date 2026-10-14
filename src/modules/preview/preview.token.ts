import { createHmac, timingSafeEqual } from "node:crypto"

export interface PreviewClaim {
  target: string
  exp: number
}

const sign = (payload: string, secret: string) => createHmac("sha256", secret).update(payload).digest("base64url")

// The cookie's value: who is being previewed and until when, signed so it cannot be edited or forged.
export function signPreview(claim: PreviewClaim, secret: string): string {
  const payload = Buffer.from(JSON.stringify(claim)).toString("base64url")
  return `${payload}.${sign(payload, secret)}`
}

// The claim inside a cookie, or null when it is missing, tampered with, malformed or past its expiry.
export function readPreview(token: string | undefined, secret: string, now = Date.now()): PreviewClaim | null {
  const [payload, mac] = token?.split(".") ?? []
  if (!payload || !mac) return null
  const expected = Buffer.from(sign(payload, secret))
  const given = Buffer.from(mac)
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null
  try {
    const claim = JSON.parse(Buffer.from(payload, "base64url").toString()) as Partial<PreviewClaim>
    if (typeof claim.target !== "string" || typeof claim.exp !== "number" || claim.exp <= now) return null
    return { target: claim.target, exp: claim.exp }
  } catch {
    return null
  }
}
