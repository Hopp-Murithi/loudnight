import "server-only"
import { Resend } from "resend"
import { emailEnv } from "@/lib/env/server"
import { AppError } from "@/lib/http/errors"

export interface OutgoingEmail {
  to: string
  subject: string
  html: string
  text: string
}

let client: Resend | undefined

// The single door to Resend. Swap the provider here and nowhere else.
export async function sendEmail(email: OutgoingEmail): Promise<string> {
  const { RESEND_API_KEY, EMAIL_FROM } = emailEnv()
  client ??= new Resend(RESEND_API_KEY)

  const { data, error } = await client.emails.send({ from: EMAIL_FROM, ...email })
  if (error || !data) {
    // Next's dev log renders a plain object as {}, so the reason has to be in the message. Never the address.
    console.error(`Email delivery failed (${error?.name ?? "no response"}): ${error?.message ?? "unknown"}`)
    throw new AppError("internal", "The email could not be sent.")
  }
  return data.id
}
