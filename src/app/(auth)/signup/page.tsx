import type { Metadata } from "next"
import Link from "next/link"
import { AuthHeading } from "@/components/layout/auth-shell"
import { ROUTES } from "@/config/site"
import { SignUpForm } from "@/modules/auth/components/signup-form"

export const metadata: Metadata = { title: "Create an account" }

export default function SignUpPage() {
  return (
    <>
      <AuthHeading
        title="Create your account"
        description="Two minutes to set up your venue. We will email you a link to confirm your address."
      />
      <SignUpForm />
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href={ROUTES.login} className="font-medium text-link underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  )
}
