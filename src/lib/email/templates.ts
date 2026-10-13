import { SITE } from "@/config/site"
import type { OutgoingEmail } from "./mailer"

type EmailBody = Omit<OutgoingEmail, "to">

interface EmailContent {
  subject: string
  heading: string
  paragraphs: string[]
  action?: { label: string; url: string }
  footnote?: string
}

const COPPER = "#A4361C"
const SPOTLIGHT = "#E8A33D"
const INK = "#1C1411"

const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

const paragraph = (text: string, color = INK) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:${color}">${escapeHtml(text)}</p>`

// Every email shares this shell, so the brand lives in one place. Plain text goes with every message.
function render({ subject, heading, paragraphs, action, footnote }: EmailContent): EmailBody {
  const button = action
    ? `<p style="margin:24px 0"><a href="${escapeHtml(action.url)}" style="background:${COPPER};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:4px;font-weight:600;font-size:15px;display:inline-block">${escapeHtml(action.label)}</a></p>
<p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#6b5c55">If the button does not work, copy this link into your browser:<br><a href="${escapeHtml(action.url)}" style="color:${COPPER};word-break:break-all">${escapeHtml(action.url)}</a></p>`
    : ""

  const html = `<!doctype html><html><body style="margin:0;background:#f4efeb;font-family:Arial,Helvetica,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:4px;overflow:hidden">
<tr><td style="background:${INK};border-bottom:4px solid ${SPOTLIGHT};padding:18px 32px;color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.5px">${escapeHtml(SITE.name)}</td></tr>
<tr><td style="padding:32px"><h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;color:${INK}">${escapeHtml(heading)}</h1>${paragraphs.map((text) => paragraph(text)).join("")}${button}${footnote ? paragraph(footnote, "#6b5c55") : ""}</td></tr>
</table></td></tr></table></body></html>`

  const text = [heading, ...paragraphs, action ? `${action.label}: ${action.url}` : "", footnote ?? ""]
    .filter(Boolean)
    .join("\n\n")

  return { subject, html, text }
}

const LINK_NOTE = "The link works once and expires in one hour."

export const emailTemplates = {
  verifyEmail: (params: { name: string; url: string }) =>
    render({
      subject: `Confirm your email for ${SITE.name}`,
      heading: `Welcome to ${SITE.name}, ${params.name}`,
      paragraphs: [
        "Confirm this is your email address to finish creating your account.",
        "Select the button below, then select Continue on the page that opens.",
      ],
      action: { label: "Confirm my email", url: params.url },
      footnote: `${LINK_NOTE} If you did not sign up, ignore this email and nothing happens.`,
    }),

  verifyAgain: (params: { url: string }) =>
    render({
      subject: `Your new ${SITE.name} confirmation link`,
      heading: "Confirm your email",
      paragraphs: ["Here is a new link to confirm your email address and sign in."],
      action: { label: "Confirm my email", url: params.url },
      footnote: `${LINK_NOTE} If you did not ask for this, ignore this email.`,
    }),

  accountExists: (params: { signInUrl: string; resetUrl: string }) =>
    render({
      subject: `You already have an ${SITE.name} account`,
      heading: "You already have an account",
      paragraphs: [
        "Someone tried to sign up with this email address, but it already has an account.",
        `If it was you, sign in instead. If you have forgotten your password, you can reset it: ${params.resetUrl}`,
      ],
      action: { label: "Sign in", url: params.signInUrl },
      footnote: "If it was not you, ignore this email. Your account has not changed.",
    }),

  passwordReset: (params: { url: string }) =>
    render({
      subject: `Reset your ${SITE.name} password`,
      heading: "Reset your password",
      paragraphs: [
        "Someone asked to reset the password for this email address.",
        "Select the button below, select Continue, then choose a new password. Your current password works until you save the new one.",
      ],
      action: { label: "Choose a new password", url: params.url },
      footnote: `${LINK_NOTE} If you did not ask for this, ignore this email and nothing changes.`,
    }),

  teamInvite: (params: { venueName: string; inviterName: string; roleLabel: string; url: string }) =>
    render({
      subject: `${params.inviterName} added you to ${params.venueName} on ${SITE.name}`,
      heading: `Join ${params.venueName}`,
      paragraphs: [
        `${params.inviterName} added you to ${params.venueName} as ${params.roleLabel}.`,
        "Select the button below, select Continue, then choose a password for your account.",
      ],
      action: { label: "Set my password", url: params.url },
      footnote: `${LINK_NOTE} If it has expired, use Forgot password on the sign-in page.`,
    }),

  addedToTeam: (params: { venueName: string; inviterName: string; roleLabel: string; url: string }) =>
    render({
      subject: `You now work at ${params.venueName} on ${SITE.name}`,
      heading: `You have been added to ${params.venueName}`,
      paragraphs: [`${params.inviterName} added you to ${params.venueName} as ${params.roleLabel}.`],
      action: { label: `Open ${params.venueName}`, url: params.url },
    }),
}
