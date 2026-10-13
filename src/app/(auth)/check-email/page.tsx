import { MailCheck } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { AuthHeading } from "@/components/layout/auth-shell"
import { ROUTES } from "@/config/site"
import { ResendVerificationForm } from "@/modules/auth/components/request-link-forms"

export const metadata: Metadata = { title: "Check your email" }

const COPY = {
  signup: {
    title: "Check your email",
    description: "We sent a link to confirm your address. Open it on this device to finish creating your account.",
  },
  verify: {
    title: "Check your email",
    description: "If that address has an account waiting to be confirmed, a new link is on its way.",
  },
  reset: {
    title: "Check your email",
    description: "If that address has an account, a link to choose a new password is on its way.",
  },
} as const

type Reason = keyof typeof COPY

const isReason = (value: unknown): value is Reason => typeof value === "string" && value in COPY

// The same message whether or not the address has an account, so this page reveals nothing.
export default async function CheckEmailPage({ searchParams }: PageProps<"/check-email">) {
  const { reason, email } = await searchParams
  const copy = COPY[isReason(reason) ? reason : "signup"]
  const address = typeof email === "string" ? email : undefined

  return (
    <>
      <MailCheck className="size-8 text-primary" aria-hidden />
      <AuthHeading title={copy.title} description={copy.description} />
      <p className="text-sm text-muted-foreground">
        Links work once and expire after one hour. Check your spam folder if nothing arrives in a few minutes.
      </p>
      {reason !== "reset" && <ResendVerificationForm email={address} />}
      <p className="text-center text-sm">
        <Link href={ROUTES.login} className="text-link underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </p>
    </>
  )
}
