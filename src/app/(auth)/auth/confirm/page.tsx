import type { Metadata } from "next"
import Link from "next/link"
import { AuthHeading } from "@/components/layout/auth-shell"
import { Button } from "@/components/ui/button"
import { ROUTES } from "@/config/site"
import { LINK_TYPES, type LinkType } from "@/modules/auth/auth.schemas"
import { ConfirmLinkForm } from "@/modules/auth/components/confirm-link-form"

export const metadata: Metadata = { title: "Confirm", robots: { index: false } }

const COPY: Record<LinkType, { title: string; description: string; label: string }> = {
  signup: {
    title: "Confirm your email",
    description: "Select Continue to confirm your address and open Loudnight.",
    label: "Continue",
  },
  magiclink: {
    title: "Confirm your email",
    description: "Select Continue to confirm your address and open Loudnight.",
    label: "Continue",
  },
  recovery: {
    title: "Reset your password",
    description: "Select Continue to choose a new password. Your old one works until you save the new one.",
    label: "Continue",
  },
  invite: {
    title: "Join your team",
    description: "Select Continue to choose the password for your new account.",
    label: "Continue",
  },
}

const isLinkType = (value: unknown): value is LinkType =>
  typeof value === "string" && (LINK_TYPES as readonly string[]).includes(value)

// The button posts the token, so a mail scanner opening the link cannot use it up.
export default async function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  const { token_hash: tokenHash, type, error } = await searchParams

  if (error || typeof tokenHash !== "string" || !isLinkType(type)) {
    return (
      <>
        <AuthHeading
          title="This link can no longer be used"
          description="Each link works once and expires after one hour. It may have been opened already, or it is too old."
        />
        <div className="flex flex-col gap-2">
          <Button size="lg" nativeButton={false} render={<Link href={ROUTES.login} />}>
            Sign in
          </Button>
          <Button size="lg" variant="outline" nativeButton={false} render={<Link href={ROUTES.forgotPassword} />}>
            Reset my password
          </Button>
        </div>
      </>
    )
  }

  const copy = COPY[type]
  return (
    <>
      <AuthHeading title={copy.title} description={copy.description} />
      <ConfirmLinkForm tokenHash={tokenHash} type={type} label={copy.label} />
    </>
  )
}
