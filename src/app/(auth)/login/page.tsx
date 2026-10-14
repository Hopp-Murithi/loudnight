import type { Metadata } from "next"
import Link from "next/link"
import { AuthHeading } from "@/components/layout/auth-shell"
import { ROUTES } from "@/config/site"
import { LoginForm } from "@/modules/auth/components/login-form"

export const metadata: Metadata = { title: "Sign in" }

export default function LoginPage() {
  return (
    <>
      <AuthHeading title="Sign in" description="Plan, launch and measure your quiet nights." />
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        New to Loudnight?{" "}
        <Link href={ROUTES.signup} className="font-medium text-link underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  )
}
