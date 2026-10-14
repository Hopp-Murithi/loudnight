"use client"

import { useState } from "react"
import { SubmitButton } from "@/components/forms/submit-button"
import { API_BASE } from "@/config/site"
import type { LinkType } from "../auth.schemas"

// A link works once, so the button locks after the first press; a second press would find it used.
export function ConfirmLinkForm({ tokenHash, type, label }: { tokenHash: string; type: LinkType; label: string }) {
  const [sent, setSent] = useState(false)
  return (
    <form method="post" action={`${API_BASE}/auth/confirm`} onSubmit={() => setSent(true)}>
      <input type="hidden" name="token_hash" value={tokenHash} />
      <input type="hidden" name="type" value={type} />
      <SubmitButton size="lg" className="w-full" pending={sent} pendingLabel="Opening Loudnight">
        {label}
      </SubmitButton>
    </form>
  )
}
