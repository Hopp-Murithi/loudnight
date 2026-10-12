"use client"

import { Share2 } from "lucide-react"
import type { ComponentProps } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

interface ShareButtonProps extends Omit<ComponentProps<typeof Button>, "onClick" | "children"> {
  url: string
  title: string
  text?: string
  label?: string
}

// The phone's own share sheet where there is one; elsewhere the link is copied.
export function ShareButton({ url, title, text, label = "Share", variant = "outline", ...props }: ShareButtonProps) {
  async function share() {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ url, title, text })
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return
        toast.error("Could not open sharing. Copy the link from the address bar instead.")
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy the link. Copy it from the address bar instead.")
    }
  }

  return (
    <Button variant={variant} onClick={share} {...props}>
      <Share2 className="size-4" aria-hidden />
      {label}
    </Button>
  )
}
